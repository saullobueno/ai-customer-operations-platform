import { eq } from "drizzle-orm";
import { member } from "@/server/db/schema";
import type { AppDatabase } from "./types";

export async function listOrganizationMembers(db: AppDatabase, organizationId: string) {
  return db.query.member.findMany({
    where: eq(member.organizationId, organizationId),
    with: { user: true },
  });
}
