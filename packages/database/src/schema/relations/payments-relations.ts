import { relations } from "drizzle-orm";
import { applications } from "../tables/applications";
import { paymentLineItems } from "../tables/payment-line-items";
import { payments } from "../tables/payments";
import { users } from "../tables/users";

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [payments.applicationId],
    references: [applications.id],
  }),
  lineItems: many(paymentLineItems),
}));