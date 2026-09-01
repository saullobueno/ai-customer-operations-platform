import { and, desc, eq } from "drizzle-orm";
import { notification } from "@/server/db/schema";
import type { AppDatabase } from "./types";

export async function listRecentNotifications(
  db: AppDatabase,
  input: { userId: string; limit?: number },
) {
  return db.query.notification.findMany({
    where: eq(notification.userId, input.userId),
    orderBy: [desc(notification.createdAt)],
    limit: input.limit ?? 10,
    with: { ticket: true },
  });
}

export async function countUnreadNotifications(db: AppDatabase, userId: string) {
  const rows = await db
    .select({ id: notification.id })
    .from(notification)
    .where(and(eq(notification.userId, userId), eq(notification.read, false)));
  return rows.length;
}

export async function markAllNotificationsRead(db: AppDatabase, userId: string) {
  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, userId), eq(notification.read, false)));
}
