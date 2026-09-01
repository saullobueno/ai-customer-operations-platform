import { PublicReportForm } from "@/components/tickets/public-report-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Abrir um chamado</CardTitle>
          <CardDescription>
            Conte o que está acontecendo — nossa equipe vai analisar e responder o mais rápido
            possível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PublicReportForm orgSlug={org ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
