import { desc, eq } from "drizzle-orm";
import { AI_MODEL_ID } from "@/server/ai/client";
import { classifyTicket, draftSuggestedResponse } from "@/server/ai/triage";
import { ticket, ticketAiSuggestion, type TicketPriority } from "@/server/db/schema";
import { recordAuditLog } from "./audit";
import { searchKnowledgeBase } from "./knowledge-base";
import { getTicketDetail } from "./tickets";
import type { AppDatabase } from "./types";

/**
 * Agente de triagem: classifica o ticket, busca contexto na base de
 * conhecimento (RAG via full-text search) e gera uma resposta sugerida.
 * Sentimento e resumo são aplicados direto no ticket (informativo, baixo
 * risco); prioridade fica como sugestão — quem decide aplicar é o agente
 * humano (ver ticketAiSuggestion + applyAiSuggestedPriority).
 */
export async function runTicketTriage(db: AppDatabase, ticketId: string) {
  const detail = await getTicketDetail(db, ticketId);
  if (!detail) throw new Error(`Ticket não encontrado: ${ticketId}`);

  const firstComment = detail.comments[0]?.body ?? "";

  const triage = await classifyTicket({ subject: detail.subject, body: firstComment });

  const relatedArticles = await searchKnowledgeBase(db, {
    organizationId: detail.organizationId,
    query: `${detail.subject} ${firstComment}`,
  });

  const suggestedResponse = await draftSuggestedResponse({
    subject: detail.subject,
    body: firstComment,
    knowledgeContext: relatedArticles.map((a) => `${a.title}\n${a.content}`),
  });

  const [suggestion] = await db
    .insert(ticketAiSuggestion)
    .values({
      ticketId,
      category: triage.category,
      sentiment: triage.sentiment,
      suggestedPriority: triage.suggestedPriority,
      summary: triage.summary,
      suggestedResponse,
      confidence: triage.confidence,
      modelId: AI_MODEL_ID,
    })
    .returning();

  await db
    .update(ticket)
    .set({ sentiment: triage.sentiment, summary: triage.summary })
    .where(eq(ticket.id, ticketId));

  await recordAuditLog(db, {
    organizationId: detail.organizationId,
    action: "ticket.ai_triage_completed",
    entityType: "ticket",
    entityId: ticketId,
    metadata: { category: triage.category, confidence: triage.confidence, modelId: AI_MODEL_ID },
  });

  return { suggestion, relatedArticles };
}

export async function getLatestAiSuggestion(db: AppDatabase, ticketId: string) {
  const [latest] = await db
    .select()
    .from(ticketAiSuggestion)
    .where(eq(ticketAiSuggestion.ticketId, ticketId))
    .orderBy(desc(ticketAiSuggestion.createdAt))
    .limit(1);

  return latest ?? null;
}

export async function applyAiSuggestedPriority(
  db: AppDatabase,
  input: {
    ticketId: string;
    organizationId: string;
    priority: TicketPriority;
    actorUserId: string;
  },
) {
  await db.update(ticket).set({ priority: input.priority }).where(eq(ticket.id, input.ticketId));

  await recordAuditLog(db, {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "ticket.ai_priority_applied",
    entityType: "ticket",
    entityId: input.ticketId,
    metadata: { priority: input.priority },
  });
}
