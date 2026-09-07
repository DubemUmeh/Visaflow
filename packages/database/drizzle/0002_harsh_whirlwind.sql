CREATE TYPE "public"."WalletTransactionType" AS ENUM('DEPOSIT', 'PAYMENT', 'REFUND', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."DepositStatus" AS ENUM('PENDING', 'CONFIRMED', 'FAILED');--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"network" text NOT NULL,
	"asset" text NOT NULL,
	"address" text NOT NULL,
	"provider" text DEFAULT 'INTERNAL_EVM' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "WalletTransactionType" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"description" text NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_address_id" uuid NOT NULL,
	"transaction_hash" text NOT NULL,
	"network" text NOT NULL,
	"asset" text NOT NULL,
	"amount" integer NOT NULL,
	"confirmations" integer DEFAULT 0 NOT NULL,
	"status" "DepositStatus" DEFAULT 'PENDING' NOT NULL,
	"credited_transaction_id" uuid,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"payment_id" uuid,
	"application_id" uuid,
	"event_type" text NOT NULL,
	"payload" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'WALLET'::text;--> statement-breakpoint
DROP TYPE "public"."PaymentProvider";--> statement-breakpoint
CREATE TYPE "public"."PaymentProvider" AS ENUM('STRIPE', 'WALLET', 'PAYPAL');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'WALLET'::"public"."PaymentProvider";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "provider" SET DATA TYPE "public"."PaymentProvider" USING "provider"::"public"."PaymentProvider";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "destination_country_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "nationality_country_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "applicant_first_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "applicant_last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "applicant_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "uploaded_documents" ALTER COLUMN "application_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_addresses" ADD CONSTRAINT "wallet_addresses_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallets_user_id_idx" ON "wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_addresses_wallet_id_idx" ON "wallet_addresses" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "wallet_addresses_user_id_idx" ON "wallet_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_addresses_network_address_idx" ON "wallet_addresses" USING btree ("network","address");--> statement-breakpoint
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "wallet_transactions_user_id_idx" ON "wallet_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_transactions_reference_idx" ON "wallet_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deposits_wallet_id_idx" ON "deposits" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "deposits_user_id_idx" ON "deposits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deposits_status_idx" ON "deposits" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "deposits_network_tx_hash_idx" ON "deposits" USING btree ("network","transaction_hash");--> statement-breakpoint
CREATE INDEX "payment_events_user_id_idx" ON "payment_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;