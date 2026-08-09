CREATE TABLE "assessment_callback_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"preferred_date" date NOT NULL,
	"time_slot" varchar(24) NOT NULL,
	"gender" varchar(24) DEFAULT 'prefer_not_to_say' NOT NULL,
	"age_range" varchar(24) DEFAULT 'prefer_not_to_say' NOT NULL,
	"marital_status" varchar(24) DEFAULT 'prefer_not_to_say' NOT NULL,
	"topics" text[] NOT NULL,
	"other_topic" varchar(300),
	"privacy_agreed" boolean NOT NULL,
	"marketing_agreed" boolean DEFAULT false NOT NULL,
	"consent_version" varchar(32) NOT NULL,
	"source" varchar(64),
	"cta_location" varchar(64),
	"utm_source" varchar(128),
	"utm_medium" varchar(128),
	"utm_campaign" varchar(128),
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"status_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_note" text,
	"admin_email_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"customer_email_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"admin_email_error" varchar(80),
	"customer_email_error" varchar(80),
	"admin_email_id" varchar(128),
	"customer_email_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_callback_requests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE INDEX "assessment_callback_status_created_idx" ON "assessment_callback_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "assessment_callback_preferred_idx" ON "assessment_callback_requests" USING btree ("preferred_date","time_slot");--> statement-breakpoint
CREATE INDEX "assessment_callback_email_created_idx" ON "assessment_callback_requests" USING btree ("email","created_at");
