import { pgEnum } from "drizzle-orm/pg-core";

export const visaCategoryEnum = pgEnum("VisaCategory", [
  "TOURISM",
  "BUSINESS",
  "STUDY",
  "WORK",
  "TRANSIT",
  "OTHER",
]);
