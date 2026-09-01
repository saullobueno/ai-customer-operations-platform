import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { customer, organization, ticket, ticketAiSuggestion } from "@/server/db/schema";
import { createTestDb, type TestDb } from "@/server/db/test-utils";
import { createKnowledgeArticle } from "./knowledge-base";
import { createTicket } from "./tickets";

vi.mock("@/server/ai/client", () => ({
  aiModel: "mock-model",
  AI_MODEL_ID: "openai/gpt-oss-120b-test",
}));

vi.mock("@/server/ai/triage", () => ({
  classifyTicket: vi.fn(async () => ({
    category: "hardware",
    sentiment: "frustrated" as const,
    suggestedPriority: "urgent" as const,
    summary: "Sensor parou de enviar dados há 2 dias.",
    confidence: 0.91,
  })),
  draftSuggestedResponse: vi.fn(async () => "Já identificamos o problema, vamos resolver."),
}));

const { runTicketTriage } = await import("./ai-triage");
const { classifyTicket, draftSuggestedResponse } = await import("@/server/ai/triage");

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

describe("runTicketTriage", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    vi.clearAllMocks();
  });

  it("classifica o ticket, busca a base de conhecimento e persiste a sugestão", async () => {
    const { org, cust } = await seed(db);

    await createKnowledgeArticle(db, {
      organizationId: org.id,
      title: "Sensor não envia dados",
      content: "Reinicie o sensor desconectando a alimentação por 10 segundos.",
    });
    await createKnowledgeArticle(db, {
      organizationId: org.id,
      title: "Como emitir segunda via de boleto",
      content: "Acesse o portal financeiro e clique em segunda via.",
    });

    const created = await createTicket(db, {
      organizationId: org.id,
      customerId: cust.id,
      subject: "Sensor offline",
      body: "Meu sensor parou de enviar dados desde ontem.",
    });

    const { suggestion, relatedArticles } = await runTicketTriage(db, created.id);

    expect(classifyTicket).toHaveBeenCalledWith({
      subject: "Sensor offline",
      body: "Meu sensor parou de enviar dados desde ontem.",
    });
    expect(draftSuggestedResponse).toHaveBeenCalledOnce();

    expect(suggestion.category).toBe("hardware");
    expect(suggestion.suggestedPriority).toBe("urgent");
    expect(relatedArticles[0]?.title).toBe("Sensor não envia dados");

    const [updatedTicket] = await db.select().from(ticket).where(eq(ticket.id, created.id));
    expect(updatedTicket.sentiment).toBe("frustrated");
    expect(updatedTicket.summary).toBe("Sensor parou de enviar dados há 2 dias.");
    expect(updatedTicket.priority).toBe("medium");

    const persisted = await db
      .select()
      .from(ticketAiSuggestion)
      .where(eq(ticketAiSuggestion.ticketId, created.id));
    expect(persisted).toHaveLength(1);
    expect(persisted[0].suggestedResponse).toBe("Já identificamos o problema, vamos resolver.");
  });
});
