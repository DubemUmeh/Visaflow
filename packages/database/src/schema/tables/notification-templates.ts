import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { notificationChannelEnum } from "../enums/notification-channel";

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(), // e.g., "application_submitted"
    channel: notificationChannelEnum("channel").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    htmlBody: text("html_body"),
    variables: text("variables").array().notNull().default([]), // List of template variable names
    isActive: boolean("is_active").notNull().default(true),
    locale: text("locale").notNull().default("en"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("notification_templates_name_idx").on(t.name),
    index("notification_templates_channel_idx").on(t.channel),
    index("notification_templates_locale_idx").on(t.locale),
  ]
);