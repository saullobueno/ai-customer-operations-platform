"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AcceptInvitationSignUpForm({
  invitationId,
  email,
}: {
  invitationId: string;
  email: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAlreadyHasAccount(false);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const { error: signUpError } = await authClient.signUp.email({
      name: String(formData.get("name")),
      email,
      password: String(formData.get("password")),
    });

    setLoading(false);
    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes("already exists")) {
        setAlreadyHasAccount(true);
      } else {
        setError(signUpError.message ?? "Não foi possível criar a conta.");
      }
      return;
    }

    // Sessão recém-criada — recarrega a mesma página de convite, que agora
    // renderiza o passo de aceitar/recusar em vez desse formulário.
    router.refresh();
  }

  if (alreadyHasAccount) {
    const nextUrl = `/accept-invitation/${invitationId}`;
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Já existe uma conta com esse e-mail. Entre com sua senha para aceitar o convite.
        </p>
        <Button asChild>
          <Link href={`/sign-in?next=${encodeURIComponent(nextUrl)}`}>Entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail convidado</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Seu nome</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Crie uma senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Criando conta…" : "Criar conta e ver o convite"}
      </Button>
    </form>
  );
}
