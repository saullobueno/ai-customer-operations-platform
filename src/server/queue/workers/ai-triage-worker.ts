import { Worker, type Job } from "bullmq";
import { db } from "@/server/db/client";
import { runTicketTriage } from "@/server/services/ai-triage";
import { createQueueConnection } from "../connection";
import { AI_TRIAGE_QUEUE_NAME, type AiTriageJobData } from "../ai-triage-queue";

/** Isolado do BullMQ para poder ser testado sem Redis. */
export async function processAiTriageJob(job: Job<AiTriageJobData>) {
  await runTicketTriage(db, job.data.ticketId);
}

export function createAiTriageWorker() {
  return new Worker<AiTriageJobData>(AI_TRIAGE_QUEUE_NAME, processAiTriageJob, {
    connection: createQueueConnection(),
    concurrency: 2,
  });
}
