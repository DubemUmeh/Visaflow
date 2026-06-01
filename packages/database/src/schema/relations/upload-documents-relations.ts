import { relations } from "drizzle-orm";
import { applications } from "../tables/applications";
import { uploadedDocuments } from "../tables/upload-documents";
import { users } from "../tables/users";

export const uploadedDocumentsRelations = relations(uploadedDocuments, ({ one }) => ({
  user: one(users, {
    fields: [uploadedDocuments.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [uploadedDocuments.applicationId],
    references: [applications.id],
  }),
}));