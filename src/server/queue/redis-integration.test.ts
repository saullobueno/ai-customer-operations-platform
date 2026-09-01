import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import { describe, expect, it, vi } from "vitest";

/**
 * Só roda contra Redis de verdade — não usa PGlite-like fallback porque
 * não existe "PGlite do Redis". Localmente (sem Docker — ver ADR 0003)
 * este describe é pulado; no CI, o job sobe um serviço `redis` real e o
 * teste valida a mecânica de fila/worker do BullMQ de ponta a ponta.
 */
async function isRedisAvailable(): Promise<boolean> {
  const client = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    retryStrategy: () => null,
    connectTimeout: 500,
  });

  try {
    await client.connect();
    await client.ping();
    return true;
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}

const redisAvailable = await isRedisAvailable();

describe.skipIf(!redisAvailable)("fila BullMQ contra Redis real", () => {
  it("um job enfileirado é processado por um worker", async () => {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const queueName = `test-ai-triage-${Date.now()}`;

    const queueConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    const workerConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    const queue = new Queue(queueName, { connection: queueConnection });
    const received: unknown[] = [];

    const worker = new Worker(
      queueName,
      async (job) => {
        received.push(job.data);
      },
      { connection: workerConnection },
    );

    try {
      await worker.waitUntilReady();
      await queue.add("triage", { ticketId: "ticket_teste_123" });

      await vi.waitFor(() => expect(received).toHaveLength(1), { timeout: 5000 });
      expect(received[0]).toEqual({ ticketId: "ticket_teste_123" });
    } finally {
      await worker.close();
      await queue.obliterate({ force: true });
      await queue.close();
      queueConnection.disconnect();
      workerConnection.disconnect();
    }
  }, 15000);
});
