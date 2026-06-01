import { relations } from "drizzle-orm";
import { supportMessages } from "../tables/support-messages";
import { supportTickets } from "../tables/support-tickets";
import { users } from "../tables/users";

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  messages: many(supportMessages),
}));