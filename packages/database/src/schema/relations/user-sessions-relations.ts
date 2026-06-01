import { relations } from "drizzle-orm";
import { userSessions } from "../tables/user-sessions";
import { users } from "../tables/users";

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));