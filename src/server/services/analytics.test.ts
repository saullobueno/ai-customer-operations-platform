import { beforeEach, describe, expect, it } from "vitest";
import { customer, organization, ticket } from "@/server/db/schema";
import { createTestDb, type TestDb } from "@/server/db/test-utils";
import { getOrganizationMetrics } from "./analytics";

async function seed(db: TestDb) {
  const [org] = await db
    .insert(organization)
    .values({ id: "org_1", name: "Econform", slug: "econform", createdAt: new Date() })
    .returning();

  const [cust] = await db
    .insert(customer)
    .values({ organizationId: org.id, name: "Cliente Beta", email: "contato@beta.com" })
    .returning();

  return { org, cust };
}

describe("getOrganizationMetrics", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("retorna zeros quando não há tickets", async () => {
    const { org } = await seed(db);
    const metrics = await getOrganizationMetrics(db, org.id);

    expect(metrics.totalTickets).toBe(0);
    expect(metrics.avgFirstResponseMinutes).toBeNull();
    expect(metrics.slaBreachRate).toBe(0);
  });

  it("agrega por status/prioridade, calcula 1ª resposta média e SLA vencido", async () => {
    const { org, cust } = await seed(db);
    const now = new Date();

    await db.insert(ticket).values([
      {
        organizationId: org.id,
        customerId: cust.id,
        subject: "A",
        status: "open",
        priority: "urgent",
        createdAt: new Date(now.getTime() - 60 * 60_000),
        firstRespondedAt: new Date(now.getTime() - 50 * 60_000), // 10 min de 1ª resposta
        slaDueAt: new Date(now.getTime() - 30 * 60_000), // já venceu, ainda não resolvido
      },
      {
        organizationId: org.id,
        customerId: cust.id,
        subject: "B",
        status: "resolved",
        priority: "low",
        createdAt: new Date(now.getTime() - 120 * 60_000),
        firstRespondedAt: new Date(now.getTime() - 90 * 60_000), // 30 min de 1ª resposta
        resolvedAt: new Date(now.getTime() - 10 * 60_000),
        slaDueAt: new Date(now.getTime() - 100 * 60_000), // resolvido depois do vencimento
      },
      {
        organizationId: org.id,
        customerId: cust.id,
        subject: "C",
        status: "open",
        priority: "medium",
        createdAt: now,
        slaDueAt: new Date(now.getTime() + 60 * 60_000), // dentro do prazo
      },
    ]);

    const metrics = await getOrganizationMetrics(db, org.id);

    expect(metrics.totalTickets).toBe(3);
    expect(metrics.byStatus.open).toBe(2);
    expect(metrics.byStatus.resolved).toBe(1);
    expect(metrics.byPriority.urgent).toBe(1);
    expect(metrics.byPriority.low).toBe(1);
    expect(metrics.byPriority.medium).toBe(1);
    expect(metrics.avgFirstResponseMinutes).toBe(20); // média entre 10 e 30
    expect(metrics.slaBreachedCount).toBe(2);
    expect(metrics.slaBreachRate).toBeCloseTo(2 / 3);
  });
});
