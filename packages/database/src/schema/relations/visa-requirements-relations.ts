import { relations } from "drizzle-orm";
import { visaRequirements } from "../tables/visa-requirements";
import { visaTypes } from "../tables/visa-types";

export const visaRequirementsRelations = relations(visaRequirements, ({ one }) => ({
  visaType: one(visaTypes, {
    fields: [visaRequirements.visaTypeId],
    references: [visaTypes.id],
  }),
}));