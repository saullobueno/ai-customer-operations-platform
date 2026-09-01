import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/client";
import { listOrganizationMembers } from "@/server/services/members";
import { cancelInvitationAction } from "@/server/actions/members";
import { InviteMemberForm } from "@/components/organizations/invite-member-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  agent: "Agente",
  member: "Membro (leitura)",
};

export default async function MembersSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) redirect("/onboarding");

  const [members, invitations] = await Promise.all([
    listOrganizationMembers(db, organizationId),
    auth.api.listInvitations({ headers: await headers(), query: { organizationId } }),
  ]);

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Membros</h1>
        <p className="text-sm text-muted-foreground">
          Quem faz parte da sua organização e convites pendentes.
        </p>
      </div>

      <Card className="gap-4 p-6">
        <h2 className="text-sm font-medium">Convidar</h2>
        <InviteMemberForm />
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Membros ({members.length})</h2>
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.id}>
              <Card className="flex-row items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{m.user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{m.user.email}</span>
                </div>
                <Badge variant="outline">{ROLE_LABEL[m.role] ?? m.role}</Badge>
              </Card>
            </li>
          ))}
        </ul>
      </div>

      {pendingInvitations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Convites pendentes ({pendingInvitations.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id}>
                <Card className="flex-row items-center justify-between gap-4 px-4 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{invitation.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_LABEL[invitation.role] ?? invitation.role}
                    </span>
                  </div>
                  <form action={cancelInvitationAction}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <SubmitButton variant="ghost" size="sm" pendingText="Cancelando…">
                      Cancelar
                    </SubmitButton>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
