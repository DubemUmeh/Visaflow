CREATE TYPE "public"."ApplicationStatus" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MISSING_DOCUMENTS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."AuditAction" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'DOCUMENT_UPLOAD', 'STATUS_CHANGE', 'ADMIN_ACTION');--> statement-breakpoint
CREATE TYPE "public"."AuthProvider" AS ENUM('LOCAL', 'GOOGLE', 'APPLE');--> statement-breakpoint
CREATE TYPE "public"."DocumentStatus" AS ENUM('PENDING', 'UPLOADING', 'PROCESSING', 'VERIFIED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."DocumentType" AS ENUM('PASSPORT_PHOTO', 'PASSPORT_COPY', 'BANK_STATEMENT', 'INVITATION_LETTER', 'TRAVEL_ITINERARY', 'HOTEL_BOOKING', 'FLIGHT_ITINERARY', 'EMPLOYMENT_LETTER', 'FINANCIAL_PROOF', 'BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'TRAVEL_INSURANCE', 'YELLOW_FEVER_CERT', 'BUSINESS_REGISTRATION', 'VISA_FOR_DESTINATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."NotificationChannel" AS ENUM('EMAIL', 'SMS', 'IN_APP', 'PUSH');--> statement-breakpoint
CREATE TYPE "public"."NotificationStatus" AS ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');--> statement-breakpoint
CREATE TYPE "public"."PaymentProvider" AS ENUM('STRIPE', 'PAYPAL');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."ProcessingTier" AS ENUM('STANDARD', 'EXPEDITED', 'RUSH');--> statement-breakpoint
CREATE TYPE "public"."SupportTicketPriority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."SupportTicketStatus" AS ENUM('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('APPLICANT', 'AGENT', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."VisaEntryType" AS ENUM('SINGLE', 'DOUBLE', 'MULTIPLE');--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"phone" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"phone_verified_at" timestamp,
	"password_hash" text,
	"role" "UserRole" DEFAULT 'APPLICANT' NOT NULL,
	"auth_provider" "AuthProvider" DEFAULT 'LOCAL' NOT NULL,
	"oauth_provider_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"avatar_url" text,
	"date_of_birth" timestamp,
	"nationality" text,
	"passport_number" text,
	"preferred_locale" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp,
	"banned_reason" text,
	"last_login_at" timestamp,
	"last_login_ip" text,
	"login_count" integer DEFAULT 0 NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"current_refresh_token_hash" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"code3" text NOT NULL,
	"capital" text,
	"region" text,
	"subregion" text,
	"flag_emoji" text,
	"flag_image_url" text,
	"phone_code" text,
	"currency" text,
	"currency_symbol" text,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"slug" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"hero_image_url" text,
	"overview" text,
	"travel_tips" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"visa_types_count" integer DEFAULT 0 NOT NULL,
	"avg_processing_days" integer,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_code_unique" UNIQUE("code"),
	CONSTRAINT "countries_code3_unique" UNIQUE("code3"),
	CONSTRAINT "countries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "visa_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visa_type_id" uuid NOT NULL,
	"document_type" "DocumentType" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"help_text" text,
	"example_url" text,
	"max_file_size_mb" integer DEFAULT 10 NOT NULL,
	"allowed_formats" text[] DEFAULT '{"pdf","jpg","jpeg","png"}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"slug" text NOT NULL,
	"destination_country_id" uuid NOT NULL,
	"nationality_country_id" uuid,
	"entry_type" "VisaEntryType" DEFAULT 'SINGLE' NOT NULL,
	"stay_duration" integer,
	"validity_period" integer,
	"description" text,
	"requirements" text,
	"notes" text,
	"is_visa_required" boolean DEFAULT true NOT NULL,
	"is_visa_on_arrival" boolean DEFAULT false NOT NULL,
	"is_e_visa" boolean DEFAULT true NOT NULL,
	"processing_days_min" integer DEFAULT 3 NOT NULL,
	"processing_days_max" integer DEFAULT 10 NOT NULL,
	"processing_days_expedited" integer,
	"processing_days_rush" integer,
	"price_standard" integer NOT NULL,
	"price_expedited" integer,
	"price_rush" integer,
	"gov_fee" integer DEFAULT 0 NOT NULL,
	"service_fee" integer NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "visa_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "eligibility_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"destination_country_id" uuid NOT NULL,
	"nationality_country_id" uuid NOT NULL,
	"visa_type_id" uuid,
	"is_visa_required" boolean DEFAULT true NOT NULL,
	"is_visa_on_arrival" boolean DEFAULT false NOT NULL,
	"is_e_visa" boolean DEFAULT false NOT NULL,
	"stay_duration_days" integer,
	"notes" text,
	"source_url" text,
	"last_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "ApplicationStatus",
	"to_status" "ApplicationStatus" NOT NULL,
	"changed_by_id" uuid,
	"note" text,
	"is_system_change" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"visa_type_id" uuid NOT NULL,
	"destination_country_id" uuid NOT NULL,
	"nationality_country_id" uuid NOT NULL,
	"status" "ApplicationStatus" DEFAULT 'DRAFT' NOT NULL,
	"processing_tier" "ProcessingTier" DEFAULT 'STANDARD' NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"total_steps" integer DEFAULT 5 NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp,
	"review_started_at" timestamp,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"travel_date_from" timestamp,
	"travel_date_to" timestamp,
	"applicant_first_name" text NOT NULL,
	"applicant_last_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"applicant_phone" text,
	"applicant_dob" timestamp,
	"applicant_passport_no" text,
	"applicant_passport_expiry" timestamp,
	"form_data" json DEFAULT '{}'::json NOT NULL,
	"draft_data" json DEFAULT '{}'::json NOT NULL,
	"last_draft_saved_at" timestamp,
	"internal_notes" text,
	"rejection_reason" text,
	"missing_documents_note" text,
	"assigned_to_id" uuid,
	"assigned_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "applications_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "uploaded_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid,
	"document_type" "DocumentType" NOT NULL,
	"status" "DocumentStatus" DEFAULT 'PENDING' NOT NULL,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum" text,
	"storage_key" text NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_region" text DEFAULT 'us-east-1' NOT NULL,
	"cdn_url" text,
	"thumbnail_url" text,
	"ocr_processed" boolean DEFAULT false NOT NULL,
	"ocr_data" json,
	"ocr_confidence" real,
	"ai_suggestions" json,
	"virus_scan_status" text DEFAULT 'PENDING' NOT NULL,
	"virus_scanned_at" timestamp,
	"is_encrypted" boolean DEFAULT true NOT NULL,
	"rejection_reason" text,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp,
	"document_expiry_date" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
	"provider" "PaymentProvider" DEFAULT 'STRIPE' NOT NULL,
	"amount_total" integer NOT NULL,
	"amount_gov_fee" integer DEFAULT 0 NOT NULL,
	"amount_service_fee" integer NOT NULL,
	"amount_tax" integer DEFAULT 0 NOT NULL,
	"amount_refunded" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"provider_payment_id" text,
	"provider_customer_id" text,
	"provider_session_id" text,
	"provider_refund_id" text,
	"processing_tier" "ProcessingTier" DEFAULT 'STANDARD' NOT NULL,
	"description" text,
	"receipt_url" text,
	"invoice_url" text,
	"failure_reason" text,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "payments_provider_payment_id_unique" UNIQUE("provider_payment_id")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"channel" "NotificationChannel" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"html_body" text,
	"variables" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "notification_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid,
	"channel" "NotificationChannel" NOT NULL,
	"status" "NotificationStatus" DEFAULT 'QUEUED' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"html_body" text,
	"template_id" text,
	"template_data" json DEFAULT '{}'::json NOT NULL,
	"recipient" text NOT NULL,
	"provider_message_id" text,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" "AuditAction" NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"old_values" json,
	"new_values" json,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"content_html" text,
	"meta_title" text,
	"meta_description" text,
	"og_image_url" text,
	"canonical_url" text,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"featured_image_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"read_time_minutes" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" json NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"page_type" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"meta_title" text,
	"meta_description" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "content_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid,
	"is_internal" boolean DEFAULT false NOT NULL,
	"body" text NOT NULL,
	"attachments" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"application_id" uuid,
	"assigned_to_id" uuid,
	"ticket_number" text NOT NULL,
	"subject" text NOT NULL,
	"status" "SupportTicketStatus" DEFAULT 'OPEN' NOT NULL,
	"priority" "SupportTicketPriority" DEFAULT 'MEDIUM' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"guest_email" text,
	"guest_name" text,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"first_response_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"min_order_amount" integer,
	"applicable_visa_type_ids" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"description" text,
	"updated_by_id" uuid,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_refresh_token_hash_idx" ON "user_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "countries_code_idx" ON "countries" USING btree ("code");--> statement-breakpoint
CREATE INDEX "countries_code3_idx" ON "countries" USING btree ("code3");--> statement-breakpoint
CREATE INDEX "countries_slug_idx" ON "countries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "countries_region_idx" ON "countries" USING btree ("region");--> statement-breakpoint
CREATE INDEX "countries_is_published_idx" ON "countries" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "countries_deleted_at_idx" ON "countries" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "visa_requirements_visa_type_id_idx" ON "visa_requirements" USING btree ("visa_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visa_types_dest_nat_entry_code_idx" ON "visa_types" USING btree ("destination_country_id","nationality_country_id","entry_type","code");--> statement-breakpoint
CREATE INDEX "visa_types_destination_country_id_idx" ON "visa_types" USING btree ("destination_country_id");--> statement-breakpoint
CREATE INDEX "visa_types_nationality_country_id_idx" ON "visa_types" USING btree ("nationality_country_id");--> statement-breakpoint
CREATE INDEX "visa_types_slug_idx" ON "visa_types" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "visa_types_is_published_idx" ON "visa_types" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "visa_types_deleted_at_idx" ON "visa_types" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "eligibility_rules_dest_nat_idx" ON "eligibility_rules" USING btree ("destination_country_id","nationality_country_id");--> statement-breakpoint
CREATE INDEX "eligibility_rules_destination_country_id_idx" ON "eligibility_rules" USING btree ("destination_country_id");--> statement-breakpoint
CREATE INDEX "eligibility_rules_nationality_country_id_idx" ON "eligibility_rules" USING btree ("nationality_country_id");--> statement-breakpoint
CREATE INDEX "app_status_history_application_id_idx" ON "application_status_history" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "app_status_history_created_at_idx" ON "application_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "applications_user_id_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "applications_visa_type_id_idx" ON "applications" USING btree ("visa_type_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_reference_number_idx" ON "applications" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "applications_destination_country_id_idx" ON "applications" USING btree ("destination_country_id");--> statement-breakpoint
CREATE INDEX "applications_nationality_country_id_idx" ON "applications" USING btree ("nationality_country_id");--> statement-breakpoint
CREATE INDEX "applications_submitted_at_idx" ON "applications" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "applications_assigned_to_id_idx" ON "applications" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "applications_deleted_at_idx" ON "applications" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "uploaded_docs_user_id_idx" ON "uploaded_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "uploaded_docs_application_id_idx" ON "uploaded_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "uploaded_docs_document_type_idx" ON "uploaded_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "uploaded_docs_status_idx" ON "uploaded_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "uploaded_docs_virus_scan_status_idx" ON "uploaded_documents" USING btree ("virus_scan_status");--> statement-breakpoint
CREATE INDEX "uploaded_docs_deleted_at_idx" ON "uploaded_documents" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "payment_line_items_payment_id_idx" ON "payment_line_items" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_application_id_idx" ON "payments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_provider_payment_id_idx" ON "payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_templates_name_idx" ON "notification_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notification_templates_locale_idx" ON "notification_templates" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_application_id_idx" ON "notifications" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_channel_idx" ON "notifications" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_id_idx" ON "audit_logs" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blog_posts_is_published_idx" ON "blog_posts" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_locale_idx" ON "blog_posts" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "blog_posts_deleted_at_idx" ON "blog_posts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "content_pages_slug_idx" ON "content_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_pages_page_type_idx" ON "content_pages" USING btree ("page_type");--> statement-breakpoint
CREATE INDEX "content_pages_locale_idx" ON "content_pages" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "faq_items_category_idx" ON "faq_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "faq_items_locale_idx" ON "faq_items" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "support_messages_ticket_id_idx" ON "support_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_messages_author_id_idx" ON "support_messages" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "support_tickets_ticket_number_idx" ON "support_tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "support_tickets_assigned_to_id_idx" ON "support_tickets" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "support_tickets_deleted_at_idx" ON "support_tickets" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promo_codes_is_active_idx" ON "promo_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_is_active_idx" ON "api_keys" USING btree ("is_active");