import { relations } from "drizzle-orm";
import { supportMessages } from "../tables/support-messages";
import { supportTickets } from "../tables/support-tickets";
import { users } from "../tables/users";

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportMessages.ticketId],
    references: [supportTickets.id],
  }),
  author: one(users, {
    fields: [supportMessages.authorId],
    references: [users.id],
  }),
}));