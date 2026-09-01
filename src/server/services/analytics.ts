import { eq } from "drizzle-orm";
import { ticket, ticketPriorityValues, ticketStatusValues } from "@/server/db/schema";
import type { AppDatabase } from "./types";

export type OrganizationMetrics = {
  totalTickets: number;
  byStatus: Record<(typeof ticketStatusValues)[number], number>;
  byPriority: Record<(typeof ticketPriorityValues)[number], number>;
  avgFirstResponseMinutes: number | null;
  slaBreachedCount: number;
  slaBreachRate: number;
};

export async function getOrganizationMetrics(
  db: AppDatabase,
  organizationId: string,
): Promise<OrganizationMetrics> {
  const tickets = await db.select().from(ticket).where(eq(ticket.organizationId, organizationId));

  const byStatus = Object.fromEntries(
    ticketStatusValues.map((s) => [s, 0]),
  ) as OrganizationMetrics["byStatus"];
  const byPriority = Object.fromEntries(
    ticketPriorityValues.map((p) => [p, 0]),
  ) as OrganizationMetrics["byPriority"];

  let firstResponseTotalMinutes = 0;
  let firstResponseCount = 0;
  let slaBreachedCount = 0;

  const now = Date.now();

  for (const t of tickets) {
    byStatus[t.status] += 1;
    byPriority[t.priority] += 1;

    if (t.firstRespondedAt) {
      firstResponseTotalMinutes += (t.firstRespondedAt.getTime() - t.createdAt.getTime()) / 60_000;
      firstResponseCount += 1;
    }

    if (t.slaDueAt) {
      const breachedAt = t.resolvedAt ? t.resolvedAt.getTime() : now;
      if (breachedAt > t.slaDueAt.getTime()) slaBreachedCount += 1;
    }
  }

  return {
    totalTickets: tickets.length,
    byStatus,
    byPriority,
    avgFirstResponseMinutes:
      firstResponseCount > 0 ? Math.round(firstResponseTotalMinutes / firstResponseCount) : null,
    slaBreachedCount,
    slaBreachRate: tickets.length > 0 ? slaBreachedCount / tickets.length : 0,
  };
}
