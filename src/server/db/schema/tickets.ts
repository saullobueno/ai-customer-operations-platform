import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

const id = (name = "id") =>
  text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const ticketStatusValues = ["open", "pending", "resolved", "closed"] as const;
export type TicketStatus = (typeof ticketStatusValues)[number];

export const ticketPriorityValues = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof ticketPriorityValues)[number];

/** Cliente final que abre tickets — não é um usuário autenticado do produto. */
export const customer = pgTable(
  "customer",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("customer_organizationId_idx").on(table.organizationId)],
);

export const ticket = pgTable(
  "ticket",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id").references(() => user.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    status: text("status", { enum: ticketStatusValues }).default("open").notNull(),
    priority: text("priority", { enum: ticketPriorityValues }).default("medium").notNull(),
    sentiment: text("sentiment"),
    summary: text("summary"),
    slaDueAt: timestamp("sla_due_at"),
    firstRespondedAt: timestamp("first_responded_at"),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ticket_organizationId_idx").on(table.organizationId),
    index("ticket_teamId_idx").on(table.teamId),
    index("ticket_assigneeId_idx").on(table.assigneeId),
    index("ticket_status_idx").on(table.status),
  ],
);

export const ticketComment = pgTable(
  "ticket_comment",
  {
    id: id(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").references(() => user.id, { onDelete: "set null" }),
    authorCustomerId: text("author_customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    internal: boolean("internal").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("ticketComment_ticketId_idx").on(table.ticketId)],
);

export const ticketAttachment = pgTable(
  "ticket_attachment",
  {
    id: id(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    commentId: text("comment_id").references(() => ticketComment.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    mimeType: text("mime_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("ticketAttachment_ticketId_idx").on(table.ticketId)],
);

export const tag = pgTable(
  "tag",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#71717a").notNull(),
  },
  (table) => [index("tag_organizationId_idx").on(table.organizationId)],
);

export const ticketTag = pgTable(
  "ticket_tag",
  {
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [index("ticketTag_ticketId_idx").on(table.ticketId)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("auditLog_organizationId_idx").on(table.organizationId),
    index("auditLog_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const notification = pgTable(
  "notification",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id").references(() => ticket.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_read_idx").on(table.userId, table.read),
  ],
);

export const customerRelations = relations(customer, ({ many }) => ({
  tickets: many(ticket),
}));

export const ticketRelations = relations(ticket, ({ one, many }) => ({
  organization: one(organization, {
    fields: [ticket.organizationId],
    references: [organization.id],
  }),
  team: one(team, { fields: [ticket.teamId], references: [team.id] }),
  customer: one(customer, { fields: [ticket.customerId], references: [customer.id] }),
  assignee: one(user, { fields: [ticket.assigneeId], references: [user.id] }),
  comments: many(ticketComment),
  attachments: many(ticketAttachment),
  tags: many(ticketTag),
}));

export const ticketCommentRelations = relations(ticketComment, ({ one, many }) => ({
  ticket: one(ticket, { fields: [ticketComment.ticketId], references: [ticket.id] }),
  authorUser: one(user, { fields: [ticketComment.authorUserId], references: [user.id] }),
  authorCustomer: one(customer, {
    fields: [ticketComment.authorCustomerId],
    references: [customer.id],
  }),
  attachments: many(ticketAttachment),
}));

export const ticketAttachmentRelations = relations(ticketAttachment, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketAttachment.ticketId], references: [ticket.id] }),
  comment: one(ticketComment, {
    fields: [ticketAttachment.commentId],
    references: [ticketComment.id],
  }),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  ticketTags: many(ticketTag),
}));

export const ticketTagRelations = relations(ticketTag, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketTag.ticketId], references: [ticket.id] }),
  tag: one(tag, { fields: [ticketTag.tagId], references: [tag.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
  ticket: one(ticket, { fields: [notification.ticketId], references: [ticket.id] }),
}));
