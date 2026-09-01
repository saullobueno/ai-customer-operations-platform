CREATE TABLE "knowledge_article" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_ai_suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"category" text NOT NULL,
	"sentiment" text NOT NULL,
	"suggested_priority" text NOT NULL,
	"summary" text NOT NULL,
	"suggested_response" text NOT NULL,
	"confidence" real NOT NULL,
	"model_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_article" ADD CONSTRAINT "knowledge_article_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_ai_suggestion" ADD CONSTRAINT "ticket_ai_suggestion_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledgeArticle_organizationId_idx" ON "knowledge_article" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ticketAiSuggestion_ticketId_idx" ON "ticket_ai_suggestion" USING btree ("ticket_id");