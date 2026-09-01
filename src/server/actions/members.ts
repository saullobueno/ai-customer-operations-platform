"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { getCurrentSession } from "@/server/auth/session";
import { env } from "@/lib/env";
import { sendOrganizationInviteEmail } from "@/server/email/notifications";
import { findOrganizationById } from "@/server/services/tickets";
import { db } from "@/server/db/client";

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Campo obrigatório: ${key}`);
  }
  return value.trim();
}

const INVITE_ROLES = ["admin", "agent", "member"] as const;

export type InviteMemberFormState = { status: "idle" } | { status: "error"; message: string };

export async function inviteMemberAction(
  _prevState: InviteMemberFormState,
  formData: FormData,
): Promise<InviteMemberFormState> {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) return { status: "error", message: "Nenhuma organização ativa." };

  const email = requiredString(formData, "email");
  const roleRaw = requiredString(formData, "role");
  const role = INVITE_ROLES.includes(roleRaw as (typeof INVITE_ROLES)[number])
    ? (roleRaw as (typeof INVITE_ROLES)[number])
    : "agent";

  try {
    const invitation = await auth.api.createInvitation({
      headers: await headers(),
      body: { email, role, organizationId },
    });

    const org = await findOrganizationById(db, organizationId);
    if (org) {
      await sendOrganizationInviteEmail({
        to: email,
        organizationName: org.name,
        acceptUrl: `${env.BETTER_AUTH_URL}/accept-invitation/${invitation.id}`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("already a member")) {
      return { status: "error", message: "Essa pessoa já faz parte da organização." };
    }
    if (message.includes("already invited") || message.includes("pending invitation")) {
      return { status: "error", message: "Já existe um convite pendente para esse e-mail." };
    }
    if (message.includes("permission") || message.includes("Forbidden")) {
      return { status: "error", message: "Você não tem permissão para convidar membros." };
    }
    return { status: "error", message: "Não foi possível enviar o convite. Tente de novo." };
  }

  revalidatePath("/settings/members");
  return { status: "idle" };
}

export async function resendInvitationAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) redirect("/onboarding");

  const email = requiredString(formData, "email");
  const roleRaw = requiredString(formData, "role");
  const role = INVITE_ROLES.includes(roleRaw as (typeof INVITE_ROLES)[number])
    ? (roleRaw as (typeof INVITE_ROLES)[number])
    : "agent";

  const invitation = await auth.api.createInvitation({
    headers: await headers(),
    body: { email, role, organizationId, resend: true },
  });

  const org = await findOrganizationById(db, organizationId);
  if (org) {
    await sendOrganizationInviteEmail({
      to: email,
      organizationName: org.name,
      acceptUrl: `${env.BETTER_AUTH_URL}/accept-invitation/${invitation.id}`,
    });
  }

  revalidatePath("/settings/members");
}

export async function cancelInvitationAction(formData: FormData) {
  const invitationId = requiredString(formData, "invitationId");

  await auth.api.cancelInvitation({
    headers: await headers(),
    body: { invitationId },
  });

  revalidatePath("/settings/members");
}

export async function acceptInvitationAction(formData: FormData) {
  const invitationId = requiredString(formData, "invitationId");

  await auth.api.acceptInvitation({
    headers: await headers(),
    body: { invitationId },
  });

  redirect("/inbox");
}

export async function rejectInvitationAction(formData: FormData) {
  const invitationId = requiredString(formData, "invitationId");

  await auth.api.rejectInvitation({
    headers: await headers(),
    body: { invitationId },
  });

  redirect("/inbox");
}
