import { relations } from "drizzle-orm";
import { applications } from "../tables/applications";
import { countries } from "../tables/countries";
import { eligibilityRules } from "../tables/eligibility-rules";
import { visaRequirements } from "../tables/visa-requirements";
import { visaTypes } from "../tables/visa-types";

export const visaTypesRelations = relations(visaTypes, ({ one, many }) => ({
  destinationCountry: one(countries, {
    fields: [visaTypes.destinationCountryId],
    references: [countries.id],
    relationName: "DestinationCountry",
  }),
  nationalityCountry: one(countries, {
    fields: [visaTypes.nationalityCountryId],
    references: [countries.id],
    relationName: "NationalityCountry",
  }),
  requirements: many(visaRequirements),
  applications: many(applications),
  eligibilityRules: many(eligibilityRules),
}));