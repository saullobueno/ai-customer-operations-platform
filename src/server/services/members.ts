import { eq } from "drizzle-orm";
import { member, user } from "@/server/db/schema";
import type { AppDatabase } from "./types";

export async function listOrganizationMembers(db: AppDatabase, organizationId: string) {
  return db.query.member.findMany({
    where: eq(member.organizationId, organizationId),
    with: { user: true },
  });
}

export async function getUserById(db: AppDatabase, userId: string) {
  const [found] = await db.select().from(user).where(eq(user.id, userId));
  return found ?? null;
}
