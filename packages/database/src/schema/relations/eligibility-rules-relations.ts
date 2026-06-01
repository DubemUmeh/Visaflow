import { relations } from "drizzle-orm";
import { countries } from "../tables/countries";
import { eligibilityRules } from "../tables/eligibility-rules";
import { visaTypes } from "../tables/visa-types";

export const eligibilityRulesRelations = relations(eligibilityRules, ({ one }) => ({
  destinationCountry: one(countries, {
    fields: [eligibilityRules.destinationCountryId],
    references: [countries.id],
  }),
  visaType: one(visaTypes, {
    fields: [eligibilityRules.visaTypeId],
    references: [visaTypes.id],
  }),
}));