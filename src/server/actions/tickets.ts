"use server";

import { revalidatePath } from "next/cache";
import { requireTicketPermission } from "@/server/auth/authorize";
import { db } from "@/server/db/client";
import { ticketPriorityValues, ticketStatusValues, type TicketStatus } from "@/server/db/schema";
import { publishTicketEvent } from "@/server/realtime/publisher";
import { enqueueAiTriage } from "@/server/queue/ai-triage-queue";
import { env } from "@/lib/env";
import { getUserById } from "@/server/services/members";
import {
  sendTicketAssignedEmail,
  sendTicketCreatedEmail,
  sendTicketReplyEmail,
} from "@/server/email/notifications";
import {
  addComment,
  addTagToTicket,
  assignTicket,
  createTicket,
  findOrCreateCustomer,
  findOrganizationById,
  findOrganizationBySlug,
  getPublicTicketDetail,
  getTicketDetail,
  listCustomerTickets,
  updateTicketStatus,
} from "@/server/services/tickets";

function trackingUrl(orgSlug: string, ticketId: string, email: string) {
  return `${env.BETTER_AUTH_URL}/report/tickets/${ticketId}?org=${orgSlug}&email=${encodeURIComponent(email)}`;
}

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Campo obrigatório: ${key}`);
  }
  return value.trim();
}

export async function replyToTicketAction(formData: FormData) {
  const ticketId = requiredString(formData, "ticketId");
  const body = requiredString(formData, "body");
  const internal = formData.get("internal") === "on";
  const attachmentUrlRaw = formData.get("attachmentUrl");
  const attachmentUrl =
    typeof attachmentUrlRaw === "string" && attachmentUrlRaw.trim() !== ""
      ? attachmentUrlRaw.trim()
      : null;

  const { userId, organizationId } = await requireTicketPermission({ ticket: ["update"] });

  await addComment(db, {
    ticketId,
    organizationId,
    body,
    internal,
    authorUserId: userId,
    attachmentUrl,
  });

  if (!internal) {
    const [org, ticketRecord] = await Promise.all([
      findOrganizationById(db, organizationId),
      getTicketDetail(db, ticketId),
    ]);
    if (org && ticketRecord) {
      await sendTicketReplyEmail({
        to: ticketRecord.customer.email,
        ticketSubject: ticketRecord.subject,
        trackingUrl: trackingUrl(org.slug, ticketId, ticketRecord.customer.email),
      });
    }
  }

  publishTicketEvent(ticketId, { type: internal ? "internal_note_added" : "comment_added" });
  revalidatePath(`/tickets/${ticketId}`);
}

export async function assignTicketAction(formData: FormData) {
  const ticketId = requiredString(formData, "ticketId");
  const assigneeIdRaw = formData.get("assigneeId");
  const assigneeId =
    typeof assigneeIdRaw === "string" && assigneeIdRaw !== "" ? assigneeIdRaw : null;

  const { userId, organizationId } = await requireTicketPermission({ ticket: ["assign"] });

  await assignTicket(db, { ticketId, organizationId, assigneeId, actorUserId: userId });

  if (assigneeId) {
    const [assignee, ticket] = await Promise.all([
      getUserById(db, assigneeId),
      getTicketDetail(db, ticketId),
    ]);
    if (assignee && ticket) {
      await sendTicketAssignedEmail({
        to: assignee.email,
        ticketSubject: ticket.subject,
        ticketUrl: `${env.BETTER_AUTH_URL}/tickets/${ticketId}`,
      });
    }
  }

  publishTicketEvent(ticketId, { type: "assigned" });
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/inbox");
}

export async function updateTicketStatusAction(formData: FormData) {
  const ticketId = requiredString(formData, "ticketId");
  const status = requiredString(formData, "status");
  if (!ticketStatusValues.includes(status as TicketStatus)) {
    throw new Error(`Status inválido: ${status}`);
  }

  const { userId, organizationId } = await requireTicketPermission({ ticket: ["update"] });

  await updateTicketStatus(db, {
    ticketId,
    organizationId,
    status: status as TicketStatus,
    actorUserId: userId,
  });

  publishTicketEvent(ticketId, { type: "status_changed", status });
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/inbox");
}

export async function addTagAction(formData: FormData) {
  const ticketId = requiredString(formData, "ticketId");
  const tagName = requiredString(formData, "tagName");

  const { userId, organizationId } = await requireTicketPermission({ ticket: ["update"] });

  await addTagToTicket(db, { ticketId, organizationId, tagName, actorUserId: userId });

  revalidatePath(`/tickets/${ticketId}`);
}

export type PublicTicketFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; ticketId: string; orgSlug: string; email: string };

/** Sem checagem de RBAC de propósito: quem abre um ticket ainda não é membro da organização. */
export async function submitPublicTicketAction(
  _prevState: PublicTicketFormState,
  formData: FormData,
): Promise<PublicTicketFormState> {
  try {
    const orgSlug = requiredString(formData, "orgSlug");
    const name = requiredString(formData, "name");
    const email = requiredString(formData, "email");
    const subject = requiredString(formData, "subject");
    const body = requiredString(formData, "body");
    const priorityRaw = formData.get("priority");
    const priority = ticketPriorityValues.includes(priorityRaw as never)
      ? (priorityRaw as (typeof ticketPriorityValues)[number])
      : "medium";

    const org = await findOrganizationBySlug(db, orgSlug);
    if (!org) return { status: "error", message: "Organização não encontrada." };

    const customer = await findOrCreateCustomer(db, { organizationId: org.id, name, email });

    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: customer.id,
      subject,
      body,
      priority,
    });

    await enqueueAiTriage(created.id);

    await sendTicketCreatedEmail({
      to: email,
      ticketSubject: subject,
      trackingUrl: trackingUrl(org.slug, created.id, email),
    });

    return { status: "success", ticketId: created.id, orgSlug: org.slug, email };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Não foi possível abrir o ticket.",
    };
  }
}

export type TrackTicketsFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      email: string;
      tickets: Awaited<ReturnType<typeof listCustomerTickets>>;
    };

/** Sem checagem de RBAC de propósito: o cliente não é membro da organização. */
export async function trackTicketsAction(
  _prevState: TrackTicketsFormState,
  formData: FormData,
): Promise<TrackTicketsFormState> {
  try {
    const orgSlug = requiredString(formData, "orgSlug");
    const email = requiredString(formData, "email");

    const org = await findOrganizationBySlug(db, orgSlug);
    if (!org) return { status: "error", message: "Organização não encontrada." };

    const tickets = await listCustomerTickets(db, { organizationId: org.id, email });
    return { status: "success", email, tickets };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Não foi possível buscar seus tickets.",
    };
  }
}

export type PublicReplyFormState = { status: "idle" } | { status: "error"; message: string };

/**
 * Sem checagem de RBAC de propósito: o cliente não é membro da organização
 * — a segurança aqui é o par (ticketId, e-mail do cliente dono do ticket),
 * validado em `getPublicTicketDetail`.
 */
export async function submitPublicReplyAction(
  _prevState: PublicReplyFormState,
  formData: FormData,
): Promise<PublicReplyFormState> {
  try {
    const orgSlug = requiredString(formData, "orgSlug");
    const ticketId = requiredString(formData, "ticketId");
    const email = requiredString(formData, "email");
    const body = requiredString(formData, "body");

    const org = await findOrganizationBySlug(db, orgSlug);
    if (!org) return { status: "error", message: "Organização não encontrada." };

    const ticketRecord = await getPublicTicketDetail(db, {
      ticketId,
      organizationId: org.id,
      email,
    });
    if (!ticketRecord) return { status: "error", message: "Ticket não encontrado." };

    await addComment(db, {
      ticketId,
      organizationId: org.id,
      body,
      internal: false,
      authorCustomerId: ticketRecord.customerId,
    });

    publishTicketEvent(ticketId, { type: "comment_added" });
    revalidatePath(`/report/tickets/${ticketId}`);

    return { status: "idle" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Não foi possível enviar sua resposta.",
    };
  }
}
