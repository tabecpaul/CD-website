CREATE TABLE "operations_alert_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_date" date NOT NULL,
	"fingerprint" varchar(64) NOT NULL,
	"status" varchar(16) DEFAULT 'sending' NOT NULL,
	"issue_count" integer NOT NULL,
	"provider_message_id" varchar(128),
	"error_code" varchar(80),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operations_alert_deliveries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "system_job_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" varchar(64) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" varchar(16) DEFAULT 'running' NOT NULL,
	"summary" jsonb,
	"error_code" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_job_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE UNIQUE INDEX "operations_alert_date_fingerprint_unique" ON "operations_alert_deliveries" USING btree ("alert_date","fingerprint");--> statement-breakpoint
CREATE INDEX "operations_alert_status_created_idx" ON "operations_alert_deliveries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "system_job_runs_name_started_idx" ON "system_job_runs" USING btree ("job_name","started_at");--> statement-breakpoint
CREATE INDEX "system_job_runs_status_started_idx" ON "system_job_runs" USING btree ("status","started_at");
