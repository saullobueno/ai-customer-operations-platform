import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getCurrentSession();
  if (session?.session.activeOrganizationId) redirect("/inbox");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        AI Customer Operations Platform
      </h1>
      <p className="max-w-md text-balance text-muted-foreground">
        Plataforma de atendimento B2B multi-tenant com classificação de tickets, busca semântica e
        um agente de IA orquestrando o fluxo de suporte.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/sign-up">Criar conta</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-in">Entrar</Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        É cliente de uma organização e quer abrir um chamado? Peça o link direto para ela — algo
        como <code>/report?org=sua-empresa</code>.
      </p>
    </div>
  );
}
