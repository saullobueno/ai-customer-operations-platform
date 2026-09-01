import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { getOrganizationMetrics } from "@/server/services/analytics";
import { StatTile } from "@/components/analytics/stat-tile";
import { DistributionBar } from "@/components/analytics/distribution-bar";

// Paleta validada (dataviz skill): categórico slots 1-4 para status,
// rampa sequencial azul (ordinal) para prioridade — ver docs/decisions.
const STATUS_COLOR = {
  open: "#2a78d6",
  pending: "#eb6834",
  resolved: "#1baf7a",
  closed: "#eda100",
} as const;

const PRIORITY_COLOR = {
  low: "#86b6ef",
  medium: "#5598e7",
  high: "#2a78d6",
  urgent: "#184f95",
} as const;

const STATUS_LABEL = {
  open: "Aberto",
  pending: "Pendente",
  resolved: "Resolvido",
  closed: "Fechado",
};
const PRIORITY_LABEL = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };

export default async function AnalyticsPage() {
  const session = await getCurrentSession();
  if (!session?.session.activeOrganizationId) redirect("/sign-in");

  const metrics = await getOrganizationMetrics(db, session.session.activeOrganizationId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Visão geral dos tickets da organização.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total de tickets" value={String(metrics.totalTickets)} />
        <StatTile
          label="1ª resposta média"
          value={
            metrics.avgFirstResponseMinutes !== null
              ? `${metrics.avgFirstResponseMinutes} min`
              : "—"
          }
        />
        <StatTile
          label="SLA vencido"
          value={`${Math.round(metrics.slaBreachRate * 100)}%`}
          tone={metrics.slaBreachRate > 0 ? "critical" : "default"}
        />
        <StatTile label="Resolvidos" value={String(metrics.byStatus.resolved)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DistributionBar
          title="Por status"
          entries={Object.entries(metrics.byStatus).map(([status, value]) => ({
            label: STATUS_LABEL[status as keyof typeof STATUS_LABEL],
            value,
            color: STATUS_COLOR[status as keyof typeof STATUS_COLOR],
          }))}
        />
        <DistributionBar
          title="Por prioridade"
          entries={Object.entries(metrics.byPriority).map(([priority, value]) => ({
            label: PRIORITY_LABEL[priority as keyof typeof PRIORITY_LABEL],
            value,
            color: PRIORITY_COLOR[priority as keyof typeof PRIORITY_COLOR],
          }))}
        />
      </div>
    </div>
  );
}
