import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { getCurrentSession } from "@/server/auth/session";
import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (session.session.activeOrganizationId) redirect("/inbox");

  /**
   * Better Auth não ativa organização nenhuma automaticamente no login —
   * a sessão fica com `activeOrganizationId` nulo mesmo que o usuário já
   * seja membro de uma. Sem isso, todo login de quem já tem organização
   * cai aqui e vê um formulário de "criar" em vez de simplesmente entrar.
   */
  const existingOrgs = await auth.api.listOrganizations({ headers: await headers() });
  if (existingOrgs.length > 0) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: existingOrgs[0].id },
    });
    redirect("/inbox");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crie sua organização</CardTitle>
          <CardDescription>
            É onde os tickets dos seus clientes vão chegar. Você poderá convidar sua equipe depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
