ALTER TABLE "assessment_callback_requests" ALTER COLUMN "preferred_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ALTER COLUMN "time_slot" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "contact_method" varchar(32) DEFAULT 'phone' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "program_cohort" varchar(128);--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "institution_name" varchar(160);--> statement-breakpoint
CREATE INDEX "assessment_callback_contact_method_created_idx" ON "assessment_callback_requests" USING btree ("contact_method","created_at");--> statement-breakpoint
CREATE INDEX "assessment_callback_source_created_idx" ON "assessment_callback_requests" USING btree ("source","created_at");