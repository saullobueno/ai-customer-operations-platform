import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "default" | "critical";
}) {
  return (
    <Card className="gap-1 px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          tone === "critical" ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </span>
    </Card>
  );
}
