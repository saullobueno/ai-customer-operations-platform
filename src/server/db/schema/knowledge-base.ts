import { relations } from "drizzle-orm";
import { index, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { ticket, ticketPriorityValues } from "./tickets";

const id = (name = "id") =>
  text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/**
 * Recuperação usa full-text search do Postgres, não embeddings — ver
 * docs/decisions/0008-rag-full-text-search.md.
 */
export const knowledgeArticle = pgTable(
  "knowledge_article",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("knowledgeArticle_organizationId_idx").on(table.organizationId)],
);

export const ticketAiSuggestion = pgTable(
  "ticket_ai_suggestion",
  {
    id: id(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    sentiment: text("sentiment").notNull(),
    suggestedPriority: text("suggested_priority", { enum: ticketPriorityValues }).notNull(),
    summary: text("summary").notNull(),
    suggestedResponse: text("suggested_response").notNull(),
    confidence: real("confidence").notNull(),
    modelId: text("model_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("ticketAiSuggestion_ticketId_idx").on(table.ticketId)],
);

export const knowledgeArticleRelations = relations(knowledgeArticle, ({ one }) => ({
  organization: one(organization, {
    fields: [knowledgeArticle.organizationId],
    references: [organization.id],
  }),
}));

export const ticketAiSuggestionRelations = relations(ticketAiSuggestion, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketAiSuggestion.ticketId], references: [ticket.id] }),
}));
