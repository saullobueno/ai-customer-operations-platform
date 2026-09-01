import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(async () => ({
    object: {
      category: "hardware",
      sentiment: "negative" as const,
      suggestedPriority: "urgent" as const,
      summary: "Sensor parou de enviar dados.",
      confidence: 0.87,
    },
  })),
  generateText: vi.fn(async () => ({ text: "Olá! Vamos verificar o sensor com você." })),
}));

vi.mock("./client", () => ({ aiModel: "mock-model", AI_MODEL_ID: "openai/gpt-oss-120b-test" }));

const { classifyTicket, draftSuggestedResponse } = await import("./triage");
const { generateObject, generateText } = await import("ai");

describe("classifyTicket", () => {
  it("retorna a classificação estruturada do modelo", async () => {
    const result = await classifyTicket({
      subject: "Sensor offline",
      body: "Meu equipamento parou de enviar dados desde ontem.",
    });

    expect(result.category).toBe("hardware");
    expect(result.sentiment).toBe("negative");
    expect(result.suggestedPriority).toBe("urgent");
    expect(generateObject).toHaveBeenCalledOnce();
  });
});

describe("draftSuggestedResponse", () => {
  it("inclui contexto da base de conhecimento no prompt quando disponível", async () => {
    const text = await draftSuggestedResponse({
      subject: "Sensor offline",
      body: "Meu equipamento parou de enviar dados.",
      knowledgeContext: ["Reinicialização de sensores\nDesligue e religue o dispositivo."],
    });

    expect(text).toBe("Olá! Vamos verificar o sensor com você.");
    const call = vi.mocked(generateText).mock.calls[0][0];
    expect(call.prompt).toContain("Reinicialização de sensores");
  });

  it("funciona sem contexto de base de conhecimento", async () => {
    const text = await draftSuggestedResponse({
      subject: "Dúvida",
      body: "Como funciona o faturamento?",
      knowledgeContext: [],
    });

    expect(text).toBeTruthy();
    const call = vi.mocked(generateText).mock.calls.at(-1)?.[0];
    expect(call?.prompt).toContain("Nenhum artigo relevante");
  });
});
