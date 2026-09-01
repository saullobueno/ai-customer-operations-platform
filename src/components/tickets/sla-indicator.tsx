function formatRelative(target: Date, now: Date) {
  const diffMinutes = Math.round((target.getTime() - now.getTime()) / 60_000);
  const abs = Math.abs(diffMinutes);
  const unit = abs < 60 ? `${abs} min` : `${Math.round(abs / 60)} h`;
  return diffMinutes >= 0 ? `em ${unit}` : `há ${unit}`;
}

export function SlaIndicator({
  slaDueAt,
  resolvedAt,
}: {
  slaDueAt: Date | null;
  resolvedAt: Date | null;
}) {
  if (resolvedAt) return <span>Resolvido</span>;
  if (!slaDueAt) return null;

  const now = new Date();
  const overdue = slaDueAt.getTime() < now.getTime();

  return (
    <span className={overdue ? "font-medium text-destructive" : undefined}>
      {overdue ? "SLA vencido" : "SLA vence"} {formatRelative(slaDueAt, now)}
    </span>
  );
}
