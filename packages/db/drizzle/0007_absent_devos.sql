CREATE TABLE "assessment_callback_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"callback_request_id" integer NOT NULL,
	"version" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"product_code" varchar(32) NOT NULL,
	"product_name" varchar(100) NOT NULL,
	"supply_amount" integer NOT NULL,
	"vat_amount" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"assessment_amount" integer NOT NULL,
	"consultation_amount" integer NOT NULL,
	"payment_status" varchar(32) DEFAULT 'awaiting_payment' NOT NULL,
	"instruction_sent_at" timestamp with time zone,
	"payment_due_at" timestamp with time zone,
	"depositor_name" varchar(100),
	"paid_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"evidence_type" varchar(24) DEFAULT 'none' NOT NULL,
	"evidence_status" varchar(24) DEFAULT 'not_requested' NOT NULL,
	"evidence_issued_at" timestamp with time zone,
	"service_status" varchar(40) DEFAULT 'not_issued' NOT NULL,
	"assessment_link_issued_at" timestamp with time zone,
	"assessment_registered_at" timestamp with time zone,
	"assessment_started_at" timestamp with time zone,
	"assessment_completed_at" timestamp with time zone,
	"consultation_start_at" timestamp with time zone,
	"consultation_end_at" timestamp with time zone,
	"consultation_change_count" integer DEFAULT 0 NOT NULL,
	"consultation_started_at" timestamp with time zone,
	"consultation_completed_at" timestamp with time zone,
	"refund_reason_code" varchar(40),
	"refund_reason_note" varchar(500),
	"refund_calculated_amount" integer,
	"refund_adjustment_amount" integer,
	"refund_final_amount" integer,
	"refund_requested_at" timestamp with time zone,
	"refund_completed_at" timestamp with time zone,
	"instruction_email_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"instruction_email_id" varchar(128),
	"instruction_email_error" varchar(80),
	"instruction_email_sent_at" timestamp with time zone,
	"confirmation_email_status" varchar(16),
	"confirmation_email_id" varchar(128),
	"confirmation_email_error" varchar(80),
	"confirmation_email_sent_at" timestamp with time zone,
	"refund_request_email_status" varchar(16),
	"refund_request_email_id" varchar(128),
	"refund_request_email_error" varchar(80),
	"refund_request_email_sent_at" timestamp with time zone,
	"refund_completed_email_status" varchar(16),
	"refund_completed_email_id" varchar(128),
	"refund_completed_email_error" varchar(80),
	"refund_completed_email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "product_code" varchar(32);--> statement-breakpoint
ALTER TABLE "assessment_callback_payments" ADD CONSTRAINT "assessment_callback_payments_callback_request_id_assessment_callback_requests_id_fk" FOREIGN KEY ("callback_request_id") REFERENCES "public"."assessment_callback_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_callback_payments_request_version_unique" ON "assessment_callback_payments" USING btree ("callback_request_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_callback_payments_one_active_unique" ON "assessment_callback_payments" USING btree ("callback_request_id") WHERE "assessment_callback_payments"."is_active" = true;--> statement-breakpoint
CREATE INDEX "assessment_callback_payments_due_idx" ON "assessment_callback_payments" USING btree ("payment_status","payment_due_at");--> statement-breakpoint
CREATE INDEX "assessment_callback_payments_service_idx" ON "assessment_callback_payments" USING btree ("service_status","updated_at");--> statement-breakpoint
CREATE INDEX "analytics_events_product_occurred_idx" ON "analytics_events" USING btree ("event_name","product_code","occurred_at");
--> statement-breakpoint
ALTER TABLE "assessment_callback_payments" ENABLE ROW LEVEL SECURITY;
