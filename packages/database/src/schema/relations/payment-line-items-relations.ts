import { relations } from "drizzle-orm";
import { paymentLineItems } from "../tables/payment-line-items";
import { payments } from "../tables/payments";

export const paymentLineItemsRelations = relations(paymentLineItems, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentLineItems.paymentId],
    references: [payments.id],
  }),
}));