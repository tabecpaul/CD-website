CREATE TABLE "lead_magnet_email_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"kind" varchar(32) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error_code" varchar(80),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_magnet_leads" ADD COLUMN "unsubscribe_token" varchar(64);--> statement-breakpoint
ALTER TABLE "lead_magnet_leads" ADD COLUMN "marketing_unsubscribed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_magnet_email_jobs" ADD CONSTRAINT "lead_magnet_email_jobs_lead_id_lead_magnet_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead_magnet_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_email_jobs_lead_kind_unique" ON "lead_magnet_email_jobs" USING btree ("lead_id","kind");--> statement-breakpoint
CREATE INDEX "lead_magnet_email_jobs_due_idx" ON "lead_magnet_email_jobs" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_leads_unsubscribe_token_unique" ON "lead_magnet_leads" USING btree ("unsubscribe_token");