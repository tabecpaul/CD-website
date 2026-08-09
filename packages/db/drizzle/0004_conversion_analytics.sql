CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(36) NOT NULL,
	"anonymous_id" varchar(64),
	"event_name" varchar(40) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"path" varchar(160),
	"cta_location" varchar(64),
	"utm_source" varchar(128),
	"utm_medium" varchar(128),
	"utm_campaign" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_events_event_id_unique" ON "analytics_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "analytics_events_name_occurred_idx" ON "analytics_events" USING btree ("event_name","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_anonymous_occurred_idx" ON "analytics_events" USING btree ("anonymous_id","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_utm_occurred_idx" ON "analytics_events" USING btree ("utm_source","utm_medium","utm_campaign","occurred_at");
