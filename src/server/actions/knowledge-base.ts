"use server";

import { revalidatePath } from "next/cache";
import { requireTicketPermission } from "@/server/auth/authorize";
import { db } from "@/server/db/client";
import { createKnowledgeArticle } from "@/server/services/knowledge-base";

export async function createKnowledgeArticleAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !content) throw new Error("Título e conteúdo são obrigatórios.");

  const { organizationId } = await requireTicketPermission({ ticket: ["update"] });

  await createKnowledgeArticle(db, { organizationId, title, content });

  revalidatePath("/knowledge-base");
}
