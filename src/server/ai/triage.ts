import { generateObject, generateText } from "ai";
import { z } from "zod";
import { ticketPriorityValues } from "@/server/db/schema";
import { aiModel } from "./client";

export const ticketTriageSchema = z.object({
  category: z
    .string()
    .describe("Categoria curta do problema, ex.: 'hardware', 'faturamento', 'dúvida de uso'"),
  sentiment: z
    .enum(["positive", "neutral", "negative", "frustrated"])
    .describe("Sentimento do cliente no relato"),
  suggestedPriority: z.enum(ticketPriorityValues),
  summary: z.string().describe("Resumo de 1-2 frases do problema, em português"),
  confidence: z.number().min(0).max(1),
});

export type TicketTriage = z.infer<typeof ticketTriageSchema>;

export async function classifyTicket(input: {
  subject: string;
  body: string;
}): Promise<TicketTriage> {
  const { object } = await generateObject({
    model: aiModel,
    schema: ticketTriageSchema,
    prompt: [
      "Você é um sistema de triagem de suporte técnico B2B.",
      "Classifique o ticket abaixo.",
      "",
      `Assunto: ${input.subject}`,
      `Descrição: ${input.body}`,
    ].join("\n"),
  });

  return object;
}

export async function draftSuggestedResponse(input: {
  subject: string;
  body: string;
  knowledgeContext: string[];
}): Promise<string> {
  const context =
    input.knowledgeContext.length > 0
      ? `Trechos relevantes da base de conhecimento:\n${input.knowledgeContext.join("\n---\n")}`
      : "Nenhum artigo relevante encontrado na base de conhecimento.";

  const { text } = await generateText({
    model: aiModel,
    prompt: [
      "Você é um agente de suporte técnico B2B, respondendo em português, em tom profissional e direto.",
      "Escreva uma resposta sugerida para o cliente, usando o contexto da base de conhecimento quando fizer sentido.",
      "Não invente informação que não esteja no ticket ou no contexto.",
      "",
      `Assunto: ${input.subject}`,
      `Descrição do cliente: ${input.body}`,
      "",
      context,
    ].join("\n"),
  });

  return text;
}
