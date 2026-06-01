import { boolean, index, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id").notNull(),
    authorId: uuid("author_id"),
    isInternal: boolean("is_internal").notNull().default(false), // Internal agent note
    body: text("body").notNull(),
    attachments: json("attachments").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("support_messages_ticket_id_idx").on(t.ticketId),
    index("support_messages_author_id_idx").on(t.authorId),
  ]
);