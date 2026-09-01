import { Badge } from "@/components/ui/badge";
import type { TicketPriority } from "@/server/db/schema";

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const PRIORITY_VARIANT: Record<
  TicketPriority,
  "destructive" | "default" | "secondary" | "outline"
> = {
  urgent: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
