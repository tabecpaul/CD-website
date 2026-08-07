CREATE TABLE "lead_magnet_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(256) NOT NULL,
	"privacy_agreed" boolean NOT NULL,
	"coaching_agreed" boolean DEFAULT false NOT NULL,
	"consent_version" varchar(32) NOT NULL,
	"source" varchar(64) DEFAULT 'career-check' NOT NULL,
	"utm_source" varchar(128),
	"utm_medium" varchar(128),
	"utm_campaign" varchar(128),
	"download_token" varchar(64) NOT NULL,
	"download_expires_at" timestamp with time zone NOT NULL,
	"last_requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_leads_email_unique" ON "lead_magnet_leads" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_magnet_leads_download_token_unique" ON "lead_magnet_leads" USING btree ("download_token");--> statement-breakpoint
CREATE INDEX "lead_magnet_leads_created_at_idx" ON "lead_magnet_leads" USING btree ("created_at");