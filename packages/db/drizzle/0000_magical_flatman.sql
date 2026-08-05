CREATE TABLE "consultation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"time_slot" text NOT NULL,
	"marketing_agreed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
