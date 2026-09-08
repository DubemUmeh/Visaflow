CREATE TYPE "public"."VisaCategory" AS ENUM('TOURISM', 'BUSINESS', 'STUDY', 'WORK', 'TRANSIT', 'OTHER');--> statement-breakpoint
ALTER TABLE "visa_types" ADD COLUMN "category" "VisaCategory" DEFAULT 'OTHER' NOT NULL;
CREATE INDEX "visa_types_category_idx" ON "visa_types" USING btree ("category");