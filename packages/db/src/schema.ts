import {
  boolean,
  index,
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
    lastRequestedAt: timestamp("last_requested_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_magnet_leads_email_unique").on(table.email),
    uniqueIndex("lead_magnet_leads_download_token_unique").on(table.downloadToken),
    index("lead_magnet_leads_created_at_idx").on(table.createdAt),
  ],
);
