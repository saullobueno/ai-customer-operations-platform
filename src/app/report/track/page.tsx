import { TrackTicketsForm } from "@/components/tickets/track-tickets-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TrackTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acompanhar chamados</CardTitle>
          <CardDescription>
            Informe o e-mail usado ao abrir o chamado para ver o andamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackTicketsForm orgSlug={org ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
