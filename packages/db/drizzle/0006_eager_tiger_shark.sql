CREATE TABLE "callback_schedule_email_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"callback_request_id" integer NOT NULL,
	"schedule_version" integer NOT NULL,
	"kind" varchar(32) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error_code" varchar(80),
	"provider_message_id" varchar(128),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "callback_schedule_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"callback_request_id" integer NOT NULL,
	"schedule_version" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "callback_schedule_email_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "callback_schedule_tokens" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "schedule_status" varchar(32) DEFAULT 'unconfirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "confirmed_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "confirmed_end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "schedule_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "confirmation_email_status" varchar(16);--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "confirmation_email_id" varchar(128);--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "confirmation_email_error" varchar(80);--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "confirmation_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "reminder_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "reschedule_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "reschedule_preferred_date" date;--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "reschedule_time_slot" varchar(24);--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "reschedule_message" varchar(500);--> statement-breakpoint
ALTER TABLE "callback_schedule_email_jobs" ADD CONSTRAINT "callback_schedule_email_jobs_callback_request_id_assessment_callback_requests_id_fk" FOREIGN KEY ("callback_request_id") REFERENCES "public"."assessment_callback_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callback_schedule_tokens" ADD CONSTRAINT "callback_schedule_tokens_callback_request_id_assessment_callback_requests_id_fk" FOREIGN KEY ("callback_request_id") REFERENCES "public"."assessment_callback_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "callback_schedule_jobs_request_version_kind_unique" ON "callback_schedule_email_jobs" USING btree ("callback_request_id","schedule_version","kind");--> statement-breakpoint
CREATE INDEX "callback_schedule_jobs_due_idx" ON "callback_schedule_email_jobs" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "callback_schedule_tokens_hash_unique" ON "callback_schedule_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "callback_schedule_tokens_request_version_idx" ON "callback_schedule_tokens" USING btree ("callback_request_id","schedule_version");--> statement-breakpoint
CREATE INDEX "assessment_callback_schedule_start_idx" ON "assessment_callback_requests" USING btree ("schedule_status","confirmed_start_at");
