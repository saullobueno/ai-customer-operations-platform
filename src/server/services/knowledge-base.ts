import { eq, sql } from "drizzle-orm";
import { knowledgeArticle } from "@/server/db/schema";
import type { AppDatabase } from "./types";

function toOrTsQuery(query: string): string {
  // Termos unidos por "|" (OR): para recuperação de contexto queremos o
  // artigo mais relevante, não exigir que TODAS as palavras apareçam
  // (plainto_tsquery usa AND e descarta quase tudo em buscas de RAG).
  return query
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[&|!():'*<>]/g, ""))
    .filter(Boolean)
    .join(" | ");
}

/** Full-text search do Postgres — ver docs/decisions/0008-rag-full-text-search.md. */
export async function searchKnowledgeBase(
  db: AppDatabase,
  input: { organizationId: string; query: string; limit?: number },
) {
  const limit = input.limit ?? 3;
  const orQuery = toOrTsQuery(input.query);
  if (!orQuery) return [];

  const tsquery = sql`to_tsquery('portuguese', ${orQuery})`;
  const tsvector = sql`to_tsvector('portuguese', ${knowledgeArticle.title} || ' ' || ${knowledgeArticle.content})`;

  return db
    .select({
      id: knowledgeArticle.id,
      title: knowledgeArticle.title,
      content: knowledgeArticle.content,
      rank: sql<number>`ts_rank(${tsvector}, ${tsquery})`,
    })
    .from(knowledgeArticle)
    .where(
      sql`${knowledgeArticle.organizationId} = ${input.organizationId} and ${tsvector} @@ ${tsquery}`,
    )
    .orderBy(sql`ts_rank(${tsvector}, ${tsquery}) desc`)
    .limit(limit);
}

export async function createKnowledgeArticle(
  db: AppDatabase,
  input: { organizationId: string; title: string; content: string },
) {
  const [created] = await db
    .insert(knowledgeArticle)
    .values({ organizationId: input.organizationId, title: input.title, content: input.content })
    .returning();
  return created;
}

export async function listKnowledgeArticles(db: AppDatabase, organizationId: string) {
  return db
    .select()
    .from(knowledgeArticle)
    .where(eq(knowledgeArticle.organizationId, organizationId));
}
