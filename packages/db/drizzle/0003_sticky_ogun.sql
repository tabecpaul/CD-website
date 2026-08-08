CREATE TABLE "lead_magnet_email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"sns_message_id" varchar(128) NOT NULL,
	"provider_message_id" varchar(128),
	"job_id" integer,
	"lead_id" integer,
	"event_type" varchar(32) NOT NULL,
	"event_subtype" varchar(64),
	"event_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_magnet_email_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_magnet_email_jobs" ADD COLUMN "provider_message_id" varchar(128);--> statement-breakpoint
ALTER TABLE "lead_magnet_email_jobs" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_magnet_email_jobs" ADD COLUMN "bounced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_magnet_email_jobs" ADD COLUMN "complained_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_magnet_leads" ADD COLUMN "email_suppressed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_magnet_leads" ADD COLUMN "email_suppression_reason" varchar(32);--> statement-breakpoint
ALTER TABLE "lead_magnet_leads" ADD COLUMN "transient_bounce_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_magnet_email_events" ADD CONSTRAINT "lead_magnet_email_events_job_id_lead_magnet_email_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."lead_magnet_email_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_magnet_email_events" ADD CONSTRAINT "lead_magnet_email_events_lead_id_lead_magnet_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead_magnet_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_email_events_sns_message_id_unique" ON "lead_magnet_email_events" USING btree ("sns_message_id");--> statement-breakpoint
CREATE INDEX "lead_magnet_email_events_provider_message_id_idx" ON "lead_magnet_email_events" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "lead_magnet_email_events_event_at_idx" ON "lead_magnet_email_events" USING btree ("event_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_email_jobs_provider_message_id_unique" ON "lead_magnet_email_jobs" USING btree ("provider_message_id");
