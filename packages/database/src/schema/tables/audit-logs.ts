import { index, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditActionEnum } from "../enums/audit-action";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    action: auditActionEnum("action").notNull(),
    resource: text("resource").notNull(), // e.g., "application", "user", "payment"
    resourceId: text("resource_id"), // UUID of affected record

    // Diff / change data
    oldValues: json("old_values"),
    newValues: json("new_values"),
    metadata: json("metadata").notNull().default({}),

    // Request context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    requestId: text("request_id"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_resource_idx").on(t.resource),
    index("audit_logs_resource_id_idx").on(t.resourceId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);