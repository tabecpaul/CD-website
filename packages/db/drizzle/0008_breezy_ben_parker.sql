CREATE TABLE "callback_payment_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"callback_request_id" integer NOT NULL,
	"payment_id" integer,
	"action" varchar(64) NOT NULL,
	"previous_status" varchar(64),
	"next_status" varchar(64),
	"amount" integer,
	"reason" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "callback_payment_audit_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "anonymous_id" varchar(64);--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "callback_payment_audit_logs" ADD CONSTRAINT "callback_payment_audit_logs_callback_request_id_assessment_callback_requests_id_fk" FOREIGN KEY ("callback_request_id") REFERENCES "public"."assessment_callback_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callback_payment_audit_logs" ADD CONSTRAINT "callback_payment_audit_logs_payment_id_assessment_callback_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."assessment_callback_payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "callback_payment_audit_callback_created_idx" ON "callback_payment_audit_logs" USING btree ("callback_request_id","created_at");--> statement-breakpoint
CREATE INDEX "callback_payment_audit_payment_created_idx" ON "callback_payment_audit_logs" USING btree ("payment_id","created_at");--> statement-breakpoint
CREATE INDEX "callback_payment_audit_action_created_idx" ON "callback_payment_audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "assessment_callback_test_created_idx" ON "assessment_callback_requests" USING btree ("is_test","created_at");--> statement-breakpoint
CREATE INDEX "assessment_callback_anonymous_created_idx" ON "assessment_callback_requests" USING btree ("anonymous_id","created_at");
