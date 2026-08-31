import { auditLog } from "@/server/db/schema";
import type { AppDatabase } from "./types";

export async function recordAuditLog(
  db: AppDatabase,
  entry: {
    organizationId: string;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(auditLog).values({
    organizationId: entry.organizationId,
    actorUserId: entry.actorUserId ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata ?? null,
  });
}
