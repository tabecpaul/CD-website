DROP INDEX "analytics_events_utm_occurred_idx";--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "utm_content" varchar(128);--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "utm_content" varchar(128);--> statement-breakpoint
ALTER TABLE "lead_magnet_leads" ADD COLUMN "utm_content" varchar(128);--> statement-breakpoint
CREATE INDEX "analytics_events_utm_occurred_idx" ON "analytics_events" USING btree ("utm_source","utm_medium","utm_campaign","utm_content","occurred_at");