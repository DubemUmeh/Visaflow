ALTER TABLE "uploaded_documents" ALTER COLUMN "application_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "uploaded_docs_storage_key_unique_idx" ON "uploaded_documents" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "uploaded_docs_application_type_active_idx" ON "uploaded_documents" USING btree ("application_id","document_type") WHERE "deleted_at" IS NULL;
