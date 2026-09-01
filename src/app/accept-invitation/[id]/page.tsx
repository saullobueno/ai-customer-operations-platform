import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { getCurrentSession } from "@/server/auth/session";
import { acceptInvitationAction, rejectInvitationAction } from "@/server/actions/members";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getCurrentSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(`/accept-invitation/${id}`)}`);

  let invitation: Awaited<ReturnType<typeof auth.api.getInvitation>> | null = null;
  try {
    invitation = await auth.api.getInvitation({ headers: await headers(), query: { id } });
  } catch {
    invitation = null;
  }

  if (!invitation || invitation.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Convite indisponível</CardTitle>
            <CardDescription>
              Esse convite não existe mais, já foi respondido, ou expirou.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitation.email !== session.user.email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Conta diferente</CardTitle>
            <CardDescription>
              Este convite foi enviado para {invitation.email}, mas você está logado como{" "}
              {session.user.email}. Entre com a conta correta para aceitar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Convite para {invitation.organizationName}</CardTitle>
          <CardDescription>
            {invitation.inviterEmail} te convidou para entrar em &quot;{invitation.organizationName}
            &quot; como {invitation.role}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <form action={acceptInvitationAction} className="flex-1">
            <input type="hidden" name="invitationId" value={invitation.id} />
            <SubmitButton pendingText="Aceitando…" className="w-full">
              Aceitar
            </SubmitButton>
          </form>
          <form action={rejectInvitationAction} className="flex-1">
            <input type="hidden" name="invitationId" value={invitation.id} />
            <SubmitButton variant="outline" pendingText="Recusando…" className="w-full">
              Recusar
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
