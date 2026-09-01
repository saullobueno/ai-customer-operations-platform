import { and, desc, eq, ilike } from "drizzle-orm";
import {
  customer,
  notification,
  organization,
  tag,
  ticket,
  ticketAttachment,
  ticketComment,
  ticketTag,
  type TicketPriority,
  type TicketStatus,
} from "@/server/db/schema";
import { recordAuditLog } from "./audit";
import { computeSlaDueAt } from "./sla";
import type { AppDatabase } from "./types";

export async function findOrganizationBySlug(db: AppDatabase, slug: string) {
  const [org] = await db.select().from(organization).where(eq(organization.slug, slug));
  return org ?? null;
}

export async function findOrCreateCustomer(
  db: AppDatabase,
  input: { organizationId: string; name: string; email: string },
) {
  const [existing] = await db
    .select()
    .from(customer)
    .where(and(eq(customer.organizationId, input.organizationId), eq(customer.email, input.email)));

  if (existing) return existing;

  const [created] = await db
    .insert(customer)
    .values({ organizationId: input.organizationId, name: input.name, email: input.email })
    .returning();

  return created;
}

export async function createTicket(
  db: AppDatabase,
  input: {
    organizationId: string;
    customerId: string;
    teamId?: string | null;
    subject: string;
    body: string;
    priority?: TicketPriority;
  },
) {
  const priority = input.priority ?? "medium";
  const now = new Date();

  const [created] = await db
    .insert(ticket)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      teamId: input.teamId ?? null,
      subject: input.subject,
      priority,
      createdAt: now,
      slaDueAt: computeSlaDueAt(priority, now),
    })
    .returning();

  await db.insert(ticketComment).values({
    ticketId: created.id,
    authorCustomerId: input.customerId,
    body: input.body,
    internal: false,
  });

  await recordAuditLog(db, {
    organizationId: input.organizationId,
    action: "ticket.created",
    entityType: "ticket",
    entityId: created.id,
    metadata: { priority, customerId: input.customerId },
  });

  return created;
}

export async function addComment(
  db: AppDatabase,
  input: {
    ticketId: string;
    organizationId: string;
    body: string;
    internal?: boolean;
    authorUserId?: string | null;
    authorCustomerId?: string | null;
    attachmentUrl?: string | null;
    attachmentFileName?: string | null;
  },
) {
  const [comment] = await db
    .insert(ticketComment)
    .values({
      ticketId: input.ticketId,
      body: input.body,
      internal: input.internal ?? false,
      authorUserId: input.authorUserId ?? null,
      authorCustomerId: input.authorCustomerId ?? null,
    })
    .returning();

  if (input.attachmentUrl) {
    await db.insert(ticketAttachment).values({
      ticketId: input.ticketId,
      commentId: comment.id,
      fileUrl: input.attachmentUrl,
      fileName: input.attachmentFileName?.trim() || input.attachmentUrl,
    });
  }

  const isFirstAgentReply = Boolean(input.authorUserId) && !input.internal;
  if (isFirstAgentReply) {
    const [current] = await db
      .select({ firstRespondedAt: ticket.firstRespondedAt, assigneeId: ticket.assigneeId })
      .from(ticket)
      .where(eq(ticket.id, input.ticketId));

    if (current && !current.firstRespondedAt) {
      await db
        .update(ticket)
        .set({ firstRespondedAt: new Date() })
        .where(eq(ticket.id, input.ticketId));
    }
  }

  await recordAuditLog(db, {
    organizationId: input.organizationId,
    actorUserId: input.authorUserId,
    action: input.internal ? "ticket.internal_note_added" : "ticket.comment_added",
    entityType: "ticket",
    entityId: input.ticketId,
  });

  if (!input.internal) {
    await notifyAssignee(db, {
      ticketId: input.ticketId,
      organizationId: input.organizationId,
      excludeUserId: input.authorUserId ?? undefined,
      type: "ticket.comment_added",
      message: "Novo comentário em um ticket que você acompanha.",
    });
  }

  return comment;
}

export async function assignTicket(
  db: AppDatabase,
  input: {
    ticketId: string;
    organizationId: string;
    assigneeId: string | null;
    actorUserId: string;
  },
) {
  await db
    .update(ticket)
    .set({ assigneeId: input.assigneeId })
    .where(eq(ticket.id, input.ticketId));

  await recordAuditLog(db, {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "ticket.assigned",
    entityType: "ticket",
    entityId: input.ticketId,
    metadata: { assigneeId: input.assigneeId },
  });

  if (input.assigneeId) {
    await db.insert(notification).values({
      organizationId: input.organizationId,
      userId: input.assigneeId,
      ticketId: input.ticketId,
      type: "ticket.assigned",
      message: "Um ticket foi atribuído a você.",
    });
  }
}

export async function updateTicketStatus(
  db: AppDatabase,
  input: { ticketId: string; organizationId: string; status: TicketStatus; actorUserId: string },
) {
  const resolvedAt = input.status === "resolved" || input.status === "closed" ? new Date() : null;

  await db
    .update(ticket)
    .set({ status: input.status, resolvedAt })
    .where(eq(ticket.id, input.ticketId));

  await recordAuditLog(db, {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "ticket.status_changed",
    entityType: "ticket",
    entityId: input.ticketId,
    metadata: { status: input.status },
  });
}

export async function addTagToTicket(
  db: AppDatabase,
  input: { ticketId: string; organizationId: string; tagName: string; actorUserId: string },
) {
  let [existingTag] = await db
    .select()
    .from(tag)
    .where(and(eq(tag.organizationId, input.organizationId), eq(tag.name, input.tagName)));

  if (!existingTag) {
    [existingTag] = await db
      .insert(tag)
      .values({ organizationId: input.organizationId, name: input.tagName })
      .returning();
  }

  await db.insert(ticketTag).values({ ticketId: input.ticketId, tagId: existingTag.id });

  await recordAuditLog(db, {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "ticket.tagged",
    entityType: "ticket",
    entityId: input.ticketId,
    metadata: { tag: input.tagName },
  });

  return existingTag;
}

export async function listInboxTickets(
  db: AppDatabase,
  filters: { organizationId: string; status?: TicketStatus; assigneeId?: string; search?: string },
) {
  const conditions = [eq(ticket.organizationId, filters.organizationId)];
  if (filters.status) conditions.push(eq(ticket.status, filters.status));
  if (filters.assigneeId) conditions.push(eq(ticket.assigneeId, filters.assigneeId));
  if (filters.search) conditions.push(ilike(ticket.subject, `%${filters.search}%`));

  return db.query.ticket.findMany({
    where: and(...conditions),
    with: { customer: true, assignee: true, tags: { with: { tag: true } } },
    orderBy: [desc(ticket.createdAt)],
  });
}

export async function getTicketDetail(db: AppDatabase, ticketId: string) {
  return db.query.ticket.findFirst({
    where: eq(ticket.id, ticketId),
    with: {
      customer: true,
      assignee: true,
      team: true,
      tags: { with: { tag: true } },
      comments: {
        orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        with: { authorUser: true, authorCustomer: true, attachments: true },
      },
    },
  });
}

async function notifyAssignee(
  db: AppDatabase,
  input: {
    ticketId: string;
    organizationId: string;
    excludeUserId?: string;
    type: string;
    message: string;
  },
) {
  const [current] = await db
    .select({ assigneeId: ticket.assigneeId })
    .from(ticket)
    .where(eq(ticket.id, input.ticketId));

  if (!current?.assigneeId || current.assigneeId === input.excludeUserId) return;

  await db.insert(notification).values({
    organizationId: input.organizationId,
    userId: current.assigneeId,
    ticketId: input.ticketId,
    type: input.type,
    message: input.message,
  });
}
