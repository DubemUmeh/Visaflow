import { relations } from "drizzle-orm";
import { applications } from "../tables/applications";
import { auditLogs } from "../tables/audit-logs";
import { blogPosts } from "../tables/blog-posts";
import { notifications } from "../tables/notifications";
import { payments } from "../tables/payments";
import { supportMessages } from "../tables/support-messages";
import { supportTickets } from "../tables/support-tickets";
import { uploadedDocuments } from "../tables/upload-documents";
import { userSessions } from "../tables/user-sessions";
import { users } from "../tables/users";

export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  payments: many(payments),
  documents: many(uploadedDocuments),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  supportTickets: many(supportTickets),
  supportMessages: many(supportMessages),
  blogPosts: many(blogPosts),
  sessions: many(userSessions),
}));