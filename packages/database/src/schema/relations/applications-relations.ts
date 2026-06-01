import { relations } from "drizzle-orm";
import { applicationStatusHistory } from "../tables/application-status-history";
import { applications } from "../tables/applications";
import { countries } from "../tables/countries";
import { notifications } from "../tables/notifications";
import { payments } from "../tables/payments";
import { uploadedDocuments } from "../tables/upload-documents";
import { users } from "../tables/users";
import { visaTypes } from "../tables/visa-types";

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  visaType: one(visaTypes, {
    fields: [applications.visaTypeId],
    references: [visaTypes.id],
  }),
  destinationCountry: one(countries, {
    fields: [applications.destinationCountryId],
    references: [countries.id],
    relationName: "DestinationApplication",
  }),
  nationalityCountry: one(countries, {
    fields: [applications.nationalityCountryId],
    references: [countries.id],
    relationName: "NationalityApplication",
  }),
  documents: many(uploadedDocuments),
  payments: many(payments),
  statusHistory: many(applicationStatusHistory),
  notifications: many(notifications),
}));