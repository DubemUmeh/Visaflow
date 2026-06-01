import { relations } from "drizzle-orm";
import { applications } from "../tables/applications";
import { notifications } from "../tables/notifications";
import { users } from "../tables/users";

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [notifications.applicationId],
    references: [applications.id],
  }),
}));