import type { TicketPriority } from "@/server/db/schema";

/**
 * Política de SLA fixa por prioridade (minutos até o vencimento da
 * primeira resposta). Um editor de política por organização fica para uma
 * fase futura — ver docs/decisions/0005-sla-fixed-policy.md.
 */
const SLA_MINUTES_BY_PRIORITY: Record<TicketPriority, number> = {
  urgent: 30,
  high: 4 * 60,
  medium: 24 * 60,
  low: 72 * 60,
};

export function computeSlaDueAt(priority: TicketPriority, from: Date = new Date()): Date {
  const minutes = SLA_MINUTES_BY_PRIORITY[priority];
  return new Date(from.getTime() + minutes * 60_000);
}
