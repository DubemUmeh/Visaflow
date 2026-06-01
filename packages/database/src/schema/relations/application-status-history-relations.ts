import { relations } from "drizzle-orm";
import { applicationStatusHistory } from "../tables/application-status-history";
import { applications } from "../tables/applications";

export const applicationStatusHistoryRelations = relations(
  applicationStatusHistory,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationStatusHistory.applicationId],
      references: [applications.id],
    }),
  })
);