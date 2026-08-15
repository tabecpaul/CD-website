CREATE TABLE "content_channel_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_item_id" integer NOT NULL,
	"channel" varchar(32) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"post_copy" text NOT NULL,
	"card_slides" jsonb,
	"alt_text" text,
	"tracked_url" varchar(2000) NOT NULL,
	"published_url" varchar(2000),
	"published_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_notification_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_task_id" integer NOT NULL,
	"kind" varchar(32) NOT NULL,
	"deduplication_key" varchar(240) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" varchar(16) DEFAULT 'sending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"provider_message_id" varchar(128),
	"error_code" varchar(80),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_operation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(240) NOT NULL,
	"category" varchar(80) NOT NULL,
	"campaign" varchar(128) NOT NULL,
	"official_url" varchar(500) NOT NULL,
	"cta_type" varchar(32) NOT NULL,
	"cta_url" varchar(500) NOT NULL,
	"is_test" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_performance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_task_id" integer NOT NULL,
	"views" integer,
	"likes" integer,
	"comments" integer,
	"saves" integer,
	"shares" integer,
	"link_clicks" integer,
	"admin_note" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_performance_views_nonnegative" CHECK ("content_performance_snapshots"."views" is null or "content_performance_snapshots"."views" >= 0),
	CONSTRAINT "content_performance_likes_nonnegative" CHECK ("content_performance_snapshots"."likes" is null or "content_performance_snapshots"."likes" >= 0),
	CONSTRAINT "content_performance_comments_nonnegative" CHECK ("content_performance_snapshots"."comments" is null or "content_performance_snapshots"."comments" >= 0),
	CONSTRAINT "content_performance_saves_nonnegative" CHECK ("content_performance_snapshots"."saves" is null or "content_performance_snapshots"."saves" >= 0),
	CONSTRAINT "content_performance_shares_nonnegative" CHECK ("content_performance_snapshots"."shares" is null or "content_performance_snapshots"."shares" >= 0),
	CONSTRAINT "content_performance_clicks_nonnegative" CHECK ("content_performance_snapshots"."link_clicks" is null or "content_performance_snapshots"."link_clicks" >= 0)
);
--> statement-breakpoint
ALTER TABLE "content_channel_tasks" ADD CONSTRAINT "content_channel_tasks_content_item_id_content_operation_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_operation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_notification_deliveries" ADD CONSTRAINT "content_notification_deliveries_channel_task_id_content_channel_tasks_id_fk" FOREIGN KEY ("channel_task_id") REFERENCES "public"."content_channel_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_performance_snapshots" ADD CONSTRAINT "content_performance_snapshots_channel_task_id_content_channel_tasks_id_fk" FOREIGN KEY ("channel_task_id") REFERENCES "public"."content_channel_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_channel_tasks_item_channel_unique" ON "content_channel_tasks" USING btree ("content_item_id","channel");--> statement-breakpoint
CREATE INDEX "content_channel_tasks_schedule_status_idx" ON "content_channel_tasks" USING btree ("scheduled_at","status");--> statement-breakpoint
CREATE INDEX "content_channel_tasks_channel_schedule_idx" ON "content_channel_tasks" USING btree ("channel","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_notification_deliveries_dedup_unique" ON "content_notification_deliveries" USING btree ("deduplication_key");--> statement-breakpoint
CREATE INDEX "content_notification_deliveries_status_schedule_idx" ON "content_notification_deliveries" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "content_notification_deliveries_task_kind_idx" ON "content_notification_deliveries" USING btree ("channel_task_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "content_operation_items_slug_unique" ON "content_operation_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_operation_items_campaign_idx" ON "content_operation_items" USING btree ("campaign");--> statement-breakpoint
CREATE INDEX "content_operation_items_category_idx" ON "content_operation_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "content_performance_task_checked_idx" ON "content_performance_snapshots" USING btree ("channel_task_id","checked_at");