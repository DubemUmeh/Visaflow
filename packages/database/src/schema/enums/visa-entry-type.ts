import { pgEnum } from "drizzle-orm/pg-core";

export const visaEntryTypeEnum = pgEnum("VisaEntryType", [
  "SINGLE",
  "DOUBLE",
  "MULTIPLE",
]);