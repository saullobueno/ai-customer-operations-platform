import { eq } from "drizzle-orm";
import { invitation, member, user } from "@/server/db/schema";
import type { AppDatabase } from "./types";

export async function listOrganizationMembers(db: AppDatabase, organizationId: string) {
  return db.query.member.findMany({
    where: eq(member.organizationId, organizationId),
    with: { user: true },
  });
}

/**
 * Leitura direta, sem sessão — usada só para mostrar organização/e-mail
 * numa pré-visualização do convite para quem ainda não tem conta.
 * `auth.api.getInvitation` exige sessão autenticada (ver
 * crud-invites.mjs), o que não existe nesse momento; aceitar/recusar de
 * verdade continua passando pela API do Better Auth, que revalida tudo.
 */
export async function getInvitationById(db: AppDatabase, invitationId: string) {
  return db.query.invitation.findFirst({
    where: eq(invitation.id, invitationId),
    with: { organization: true },
  });
}

export async function getUserById(db: AppDatabase, userId: string) {
  const [found] = await db.select().from(user).where(eq(user.id, userId));
  return found ?? null;
}
