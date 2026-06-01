import { relations } from "drizzle-orm";
import { applications } from "../tables/applications";
import { countries } from "../tables/countries";
import { eligibilityRules } from "../tables/eligibility-rules";
import { visaTypes } from "../tables/visa-types";

export const countriesRelations = relations(countries, ({ many }) => ({
  visaTypesAsDestination: many(visaTypes, { relationName: "DestinationCountry" }),
  visaTypesAsNationality: many(visaTypes, { relationName: "NationalityCountry" }),
  applicationsAsDestination: many(applications, { relationName: "DestinationApplication" }),
  applicationsAsNationality: many(applications, { relationName: "NationalityApplication" }),
  eligibilityRules: many(eligibilityRules),
}));