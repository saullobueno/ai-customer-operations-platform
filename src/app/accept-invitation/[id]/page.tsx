import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/server/auth/config";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { getInvitationById } from "@/server/services/members";
import { acceptInvitationAction, rejectInvitationAction } from "@/server/actions/members";
import { AcceptInvitationSignUpForm } from "@/components/organizations/accept-invitation-signup-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function unavailableCard() {
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

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getCurrentSession();

  if (!session) {
    const pending = await getInvitationById(db, id);
    if (!pending || pending.status !== "pending" || pending.expiresAt < new Date()) {
      return unavailableCard();
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Convite para {pending.organization.name}</CardTitle>
            <CardDescription>
              Crie sua conta para entrar em &quot;{pending.organization.name}&quot; como{" "}
              {pending.role}. Expira em {pending.expiresAt.toLocaleString("pt-BR")}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AcceptInvitationSignUpForm invitationId={id} email={pending.email} />
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                href={`/sign-in?next=${encodeURIComponent(`/accept-invitation/${id}`)}`}
                className="text-foreground underline underline-offset-4"
              >
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let invitation: Awaited<ReturnType<typeof auth.api.getInvitation>> | null = null;
  let wrongAccount = false;
  try {
    invitation = await auth.api.getInvitation({ headers: await headers(), query: { id } });
  } catch (error) {
    /**
     * O Better Auth já valida que o e-mail da sessão logada bate com o do
     * convite dentro de `getInvitation` — se não bater, lança em vez de
     * retornar os dados. Sem checar essa mensagem específica, esse caso
     * (a causa mais comum de "convite não encontrado" na prática — a
     * pessoa clica no link ainda logada com outra conta) ficava
     * indistinguível de convite realmente expirado/cancelado.
     */
    const message = error instanceof Error ? error.message : "";
    wrongAccount = message.includes("not the recipient");
  }

  if (wrongAccount) {
    const nextUrl = `/accept-invitation/${id}`;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Conta diferente</CardTitle>
            <CardDescription>
              Este convite foi enviado para outro e-mail, mas você está logado como{" "}
              {session.user.email}. Saia e entre com a conta que recebeu o convite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton redirectTo={`/sign-in?next=${encodeURIComponent(nextUrl)}`}>
              Sair e entrar com outra conta
            </SignOutButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || invitation.status !== "pending") {
    return unavailableCard();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Convite para {invitation.organizationName}</CardTitle>
          <CardDescription>
            {invitation.inviterEmail} te convidou para entrar em &quot;{invitation.organizationName}
            &quot; como {invitation.role}. Expira em{" "}
            {new Date(invitation.expiresAt).toLocaleString("pt-BR")}.
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
