import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { createOrganizationAction } from "@/server/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (session.session.activeOrganizationId) redirect("/inbox");

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
          <form action={createOrganizationAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome da organização</Label>
              <Input id="name" name="name" placeholder="Econform" required />
            </div>
            <Button type="submit">Criar organização</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
