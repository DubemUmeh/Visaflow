import { relations } from "drizzle-orm";
import { auditLogs } from "../tables/audit-logs";
import { users } from "../tables/users";

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));