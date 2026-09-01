import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { auditLog, customer, notification, organization, user } from "@/server/db/schema";
import { createTestDb, type TestDb } from "@/server/db/test-utils";
import {
  addComment,
  addTagToTicket,
  assignTicket,
  createTicket,
  getTicketDetail,
  listInboxTickets,
  updateTicketStatus,
} from "./tickets";

async function seed(db: TestDb) {
  const [org] = await db
    .insert(organization)
    .values({ id: "org_1", name: "Econform", slug: "econform", createdAt: new Date() })
    .returning();

  const [agent] = await db
    .insert(user)
    .values({ id: "user_agent", name: "Ana Agente", email: "ana@econform.com.br" })
    .returning();

  const [cust] = await db
    .insert(customer)
    .values({ organizationId: org.id, name: "Cliente Beta", email: "contato@beta.com" })
    .returning();

  return { org, agent, cust };
}

describe("tickets service", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("cria ticket com SLA calculado e primeiro comentário do cliente", async () => {
    const { org, cust } = await seed(db);

    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Equipamento parou de enviar dados",
      body: "Meu sensor está offline desde ontem.",
      priority: "urgent",
    });

    expect(created.status).toBe("open");
    expect(created.slaDueAt).toBeInstanceOf(Date);
    expect(created.slaDueAt!.getTime() - created.createdAt.getTime()).toBe(30 * 60_000);

    const detail = await getTicketDetail(db, created.id);
    expect(detail?.comments).toHaveLength(1);
    expect(detail?.comments[0].authorCustomerId).toBe(cust.id);

    const logs = await db.select().from(auditLog).where(eq(auditLog.entityId, created.id));
    expect(logs.map((l) => l.action)).toContain("ticket.created");
  });

  it("anexa um arquivo (por URL) a um comentário", async () => {
    const { org, agent, cust } = await seed(db);
    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Erro ao gerar relatório",
      body: "O botão de exportar não funciona.",
    });

    await addComment(db, {
      ticketId: created.id,
      organizationId: org.id,
      authorUserId: agent.id,
      body: "Segue print do erro.",
      attachmentUrl: "https://files.example.com/print.png",
      attachmentFileName: "print.png",
    });

    const detail = await getTicketDetail(db, created.id);
    const withAttachment = detail?.comments.find((c) => c.attachments.length > 0);

    expect(withAttachment?.attachments).toEqual([
      expect.objectContaining({
        fileName: "print.png",
        fileUrl: "https://files.example.com/print.png",
      }),
    ]);
  });

  it("marca firstRespondedAt só na primeira resposta pública de agente, não em notas internas", async () => {
    const { org, agent, cust } = await seed(db);
    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Dúvida de faturamento",
      body: "Preciso da nota fiscal.",
    });

    await addComment(db, {
      ticketId: created.id,
      organizationId: org.id,
      authorUserId: agent.id,
      body: "Nota interna: verificar com financeiro",
      internal: true,
    });

    let detail = await getTicketDetail(db, created.id);
    expect(detail?.comments.some((c) => c.internal)).toBe(true);
    expect(detail?.firstRespondedAt).toBeNull();

    await addComment(db, {
      ticketId: created.id,
      organizationId: org.id,
      authorUserId: agent.id,
      body: "Já te enviei por e-mail!",
      internal: false,
    });

    detail = await getTicketDetail(db, created.id);
    expect(detail?.comments).toHaveLength(3);
    expect(detail?.firstRespondedAt).toBeInstanceOf(Date);
  });

  it("atribui ticket e gera notificação para o novo responsável", async () => {
    const { org, agent, cust } = await seed(db);
    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Erro no dashboard",
      body: "Gráficos não carregam.",
    });

    await assignTicket(db, {
      ticketId: created.id,
      organizationId: org.id,
      assigneeId: agent.id,
      actorUserId: agent.id,
    });

    const detail = await getTicketDetail(db, created.id);
    expect(detail?.assignee?.id).toBe(agent.id);

    const notifications = await db
      .select()
      .from(notification)
      .where(eq(notification.userId, agent.id));
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("ticket.assigned");
  });

  it("atualiza status e marca resolvedAt ao resolver", async () => {
    const { org, agent, cust } = await seed(db);
    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Solicitação de reembolso",
      body: "Cobrança duplicada.",
    });

    await updateTicketStatus(db, {
      ticketId: created.id,
      organizationId: org.id,
      status: "resolved",
      actorUserId: agent.id,
    });

    const detail = await getTicketDetail(db, created.id);
    expect(detail?.status).toBe("resolved");
    expect(detail?.resolvedAt).toBeInstanceOf(Date);
  });

  it("reaproveita uma tag existente da organização em vez de duplicar", async () => {
    const { org, agent, cust } = await seed(db);
    const ticketA = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "A",
      body: "A",
    });
    const ticketB = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "B",
      body: "B",
    });

    const tagA = await addTagToTicket(db, {
      ticketId: ticketA.id,
      organizationId: org.id,
      tagName: "bug",
      actorUserId: agent.id,
    });
    const tagB = await addTagToTicket(db, {
      ticketId: ticketB.id,
      organizationId: org.id,
      tagName: "bug",
      actorUserId: agent.id,
    });

    expect(tagA.id).toBe(tagB.id);
  });

  it("lista tickets da inbox filtrando por status", async () => {
    const { org, cust } = await seed(db);
    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Ticket aberto",
      body: "...",
    });

    const open = await listInboxTickets(db, { organizationId: org.id, status: "open" });
    const resolved = await listInboxTickets(db, { organizationId: org.id, status: "resolved" });

    expect(open.map((t) => t.id)).toContain(created.id);
    expect(resolved).toHaveLength(0);
  });

  it("busca tickets por trecho do assunto, sem diferenciar maiúsculas/minúsculas", async () => {
    const { org, cust } = await seed(db);
    const sensor = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Sensor offline",
      body: "...",
    });
    await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Dúvida de faturamento",
      body: "...",
    });

    const results = await listInboxTickets(db, { organizationId: org.id, search: "SENSOR" });

    expect(results.map((t) => t.id)).toEqual([sensor.id]);
  });
});
