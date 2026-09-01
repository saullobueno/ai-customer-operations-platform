import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { createProPlanCheckoutSessionAction } from "@/server/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; mocked?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session?.session.activeOrganizationId) redirect("/sign-in");

  const { success, mocked } = await searchParams;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Plano da sua organização.</p>
      </div>

      {success && (
        <p className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          Pagamento confirmado pela Stripe — o webhook registrou o evento no audit log.
        </p>
      )}
      {mocked && (
        <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Stripe não está configurado nesta instância (sem STRIPE_SECRET_KEY / STRIPE_PRICE_ID_PRO)
          — este é o estado de demonstração. Ver{" "}
          <code>docs/decisions/0011-stripe-billing-mocked.md</code>.
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Free</CardTitle>
            <CardDescription>Plano atual</CardDescription>
          </div>
          <Badge variant="secondary">Ativo</Badge>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tickets, inbox, IA e analytics ilimitados durante a demonstração.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pro</CardTitle>
          <CardDescription>
            Checkout via Stripe (modo teste) — ver ADR 0011 para o estado atual da integração.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProPlanCheckoutSessionAction}>
            <Button type="submit">Fazer upgrade para Pro</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
