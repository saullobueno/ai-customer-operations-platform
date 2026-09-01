"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { markAllNotificationsRead } from "@/server/services/notifications";

export async function markAllNotificationsReadAction() {
  const session = await getCurrentSession();
  if (!session) return;

  await markAllNotificationsRead(db, session.user.id);
  revalidatePath("/", "layout");
}
