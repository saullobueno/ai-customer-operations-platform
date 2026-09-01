import { Queue } from "bullmq";
import { createQueueConnection } from "./connection";

export const AI_TRIAGE_QUEUE_NAME = "ai-triage";

export type AiTriageJobData = { ticketId: string };

let queue: Queue<AiTriageJobData> | null = null;

function getQueue() {
  queue ??= new Queue<AiTriageJobData>(AI_TRIAGE_QUEUE_NAME, {
    connection: createQueueConnection(),
  });
  return queue;
}

/**
 * Best-effort: se o Redis não estiver disponível (ex.: dev local sem
 * Docker — ver ADR 0003), a criação do ticket não deve falhar por causa
 * disso. O agente sempre pode disparar a triagem manualmente pela UI
 * (botão "Analisar com IA", fase 4).
 */
export async function enqueueAiTriage(ticketId: string): Promise<void> {
  try {
    await getQueue().add("triage", { ticketId });
  } catch (error) {
    console.error(`[ai-triage-queue] falha ao enfileirar ticket ${ticketId}:`, error);
  }
}
