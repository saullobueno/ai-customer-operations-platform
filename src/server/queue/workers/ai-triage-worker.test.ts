import { describe, expect, it, vi } from "vitest";
import type { Job } from "bullmq";
import type { AiTriageJobData } from "../ai-triage-queue";

vi.mock("@/server/db/client", () => ({ db: "mock-db" }));
vi.mock("../connection", () => ({ createQueueConnection: vi.fn() }));
vi.mock("@/server/services/ai-triage", () => ({
  runTicketTriage: vi.fn(async () => ({ suggestion: {}, relatedArticles: [] })),
}));

const { processAiTriageJob } = await import("./ai-triage-worker");
const { runTicketTriage } = await import("@/server/services/ai-triage");

describe("processAiTriageJob", () => {
  it("roda a triagem para o ticket do job, sem depender do BullMQ/Redis", async () => {
    const job = { data: { ticketId: "ticket_1" } } as Job<AiTriageJobData>;

    await processAiTriageJob(job);

    expect(runTicketTriage).toHaveBeenCalledWith("mock-db", "ticket_1");
  });
});
