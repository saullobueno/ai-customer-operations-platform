export function DistributionBar({
  title,
  entries,
}: {
  title: string;
  entries: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...entries.map((e) => e.value));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.label} className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm text-secondary-foreground">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(entry.value / max) * 100}%`,
                  backgroundColor: entry.color,
                }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
