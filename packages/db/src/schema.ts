import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const consultationRequests = pgTable("consultation_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  timeSlot: text("time_slot").notNull(),
  marketingAgreed: boolean("marketing_agreed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leadMagnetLeads = pgTable(
  "lead_magnet_leads",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 256 }).notNull(),
    privacyAgreed: boolean("privacy_agreed").notNull(),
    coachingAgreed: boolean("coaching_agreed").notNull().default(false),
    consentVersion: varchar("consent_version", { length: 32 }).notNull(),
    source: varchar("source", { length: 64 }).notNull().default("career-check"),
    utmSource: varchar("utm_source", { length: 128 }),
    utmMedium: varchar("utm_medium", { length: 128 }),
    utmCampaign: varchar("utm_campaign", { length: 128 }),
    downloadToken: varchar("download_token", { length: 64 }).notNull(),
    downloadExpiresAt: timestamp("download_expires_at", { withTimezone: true }).notNull(),
    unsubscribeToken: varchar("unsubscribe_token", { length: 64 }),
    marketingUnsubscribedAt: timestamp("marketing_unsubscribed_at", { withTimezone: true }),
    emailSuppressedAt: timestamp("email_suppressed_at", { withTimezone: true }),
    emailSuppressionReason: varchar("email_suppression_reason", { length: 32 }),
    transientBounceCount: integer("transient_bounce_count").notNull().default(0),
    lastRequestedAt: timestamp("last_requested_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_magnet_leads_email_unique").on(table.email),
    uniqueIndex("lead_magnet_leads_download_token_unique").on(table.downloadToken),
    uniqueIndex("lead_magnet_leads_unsubscribe_token_unique").on(table.unsubscribeToken),
    index("lead_magnet_leads_created_at_idx").on(table.createdAt),
  ],
);

export const leadMagnetEmailJobs = pgTable(
  "lead_magnet_email_jobs",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull().references(() => leadMagnetLeads.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 32 }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastErrorCode: varchar("last_error_code", { length: 80 }),
    providerMessageId: varchar("provider_message_id", { length: 128 }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    bouncedAt: timestamp("bounced_at", { withTimezone: true }),
    complainedAt: timestamp("complained_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_magnet_email_jobs_lead_kind_unique").on(table.leadId, table.kind),
    uniqueIndex("lead_magnet_email_jobs_provider_message_id_unique").on(table.providerMessageId),
    index("lead_magnet_email_jobs_due_idx").on(table.status, table.scheduledAt),
  ],
);

export const leadMagnetEmailEvents = pgTable(
  "lead_magnet_email_events",
  {
    id: serial("id").primaryKey(),
    snsMessageId: varchar("sns_message_id", { length: 128 }).notNull(),
    providerMessageId: varchar("provider_message_id", { length: 128 }),
    jobId: integer("job_id").references(() => leadMagnetEmailJobs.id, { onDelete: "set null" }),
    leadId: integer("lead_id").references(() => leadMagnetLeads.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 32 }).notNull(),
    eventSubtype: varchar("event_subtype", { length: 64 }),
    eventAt: timestamp("event_at", { withTimezone: true }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_magnet_email_events_sns_message_id_unique").on(table.snsMessageId),
    index("lead_magnet_email_events_provider_message_id_idx").on(table.providerMessageId),
    index("lead_magnet_email_events_event_at_idx").on(table.eventAt),
  ],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    eventId: varchar("event_id", { length: 36 }).notNull(),
    anonymousId: varchar("anonymous_id", { length: 64 }),
    eventName: varchar("event_name", { length: 40 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    path: varchar("path", { length: 160 }),
    ctaLocation: varchar("cta_location", { length: 64 }),
    utmSource: varchar("utm_source", { length: 128 }),
    utmMedium: varchar("utm_medium", { length: 128 }),
    utmCampaign: varchar("utm_campaign", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("analytics_events_event_id_unique").on(table.eventId),
    index("analytics_events_name_occurred_idx").on(table.eventName, table.occurredAt),
    index("analytics_events_anonymous_occurred_idx").on(table.anonymousId, table.occurredAt),
    index("analytics_events_utm_occurred_idx").on(table.utmSource, table.utmMedium, table.utmCampaign, table.occurredAt),
  ],
);
