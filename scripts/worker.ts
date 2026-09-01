import { createAiTriageWorker } from "../src/server/queue/workers/ai-triage-worker";

const worker = createAiTriageWorker();

worker.on("completed", (job) => {
  console.log(`[worker] triagem concluída: ticket ${job.data.ticketId}`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] triagem falhou: ticket ${job?.data.ticketId}`, error);
});

console.log("[worker] aguardando jobs de triagem de IA...");

async function shutdown() {
  console.log("[worker] encerrando...");
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
