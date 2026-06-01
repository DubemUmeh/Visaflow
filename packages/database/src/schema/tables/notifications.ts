import { index, integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { notificationChannelEnum } from "../enums/notification-channel";
import { notificationStatusEnum } from "../enums/notification-status";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    applicationId: uuid("application_id"),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").notNull().default("QUEUED"),

    // Content
    subject: text("subject"),
    body: text("body").notNull(),
    htmlBody: text("html_body"),
    templateId: text("template_id"),
    templateData: json("template_data").notNull().default({}),

    // Delivery
    recipient: text("recipient").notNull(), // email or phone number
    providerMessageId: text("provider_message_id"),
    failureReason: text("failure_reason"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    scheduledFor: timestamp("scheduled_for"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_application_id_idx").on(t.applicationId),
    index("notifications_status_idx").on(t.status),
    index("notifications_channel_idx").on(t.channel),
    index("notifications_scheduled_for_idx").on(t.scheduledFor),
    index("notifications_created_at_idx").on(t.createdAt),
  ]
);