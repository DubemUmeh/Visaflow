CREATE UNIQUE INDEX "uploaded_docs_storage_key_unique_idx" ON "uploaded_documents" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "uploaded_docs_application_type_active_idx" ON "uploaded_documents" USING btree ("application_id","document_type") WHERE "deleted_at" IS NULL;
