import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { applicationStatusEnum } from "../enums/application-status";

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id").notNull(),
    fromStatus: applicationStatusEnum("from_status"),
    toStatus: applicationStatusEnum("to_status").notNull(),
    changedById: uuid("changed_by_id"),
    note: text("note"),
    isSystemChange: boolean("is_system_change").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("app_status_history_application_id_idx").on(t.applicationId),
    index("app_status_history_created_at_idx").on(t.createdAt),
  ]
);