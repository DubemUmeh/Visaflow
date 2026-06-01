import { pgEnum } from "drizzle-orm/pg-core";

export const auditActionEnum = pgEnum("AuditAction", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "PAYMENT",
  "DOCUMENT_UPLOAD",
  "STATUS_CHANGE",
  "ADMIN_ACTION",
]);