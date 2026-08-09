import { sql } from "drizzle-orm";
import { db } from "@newland/db";

export type DashboardPeriod = 7 | 30 | 90;

export function parsePeriod(value: string | undefined): DashboardPeriod {
  return value === "7" || value === "90" ? Number(value) as DashboardPeriod : 30;
}

function kstStart(days: DashboardPeriod) {
  const kstNow = new Date(Date.now() + 9 * 3_600_000);
  return new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() - days + 1) - 9 * 3_600_000);
}

type FunnelRow = {
  visitors: number;
  leads: number;
  downloads: number;
  ctaClicks: number;
  consultations: number;
};
type EmailRow = { sent: number; delivered: number; bounced: number; complained: number; unsubscribed: number };
export type UtmRow = FunnelRow & { utmSource: string; utmMedium: string; utmCampaign: string };

function numeric<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value])) as T;
}

export async function getAnalyticsDashboard(period: DashboardPeriod) {
  const start = kstStart(period);
  // Raw postgres.js queries do not serialize Date instances in every runtime.
  // Pass an ISO string and cast it explicitly so Vercel and local builds behave alike.
  const startIso = start.toISOString();
  const [funnelResult, emailResult, unsubscribedResult, utmResult] = await Promise.all([
    db.execute(sql`
      select
        count(distinct anonymous_id) filter (where event_name = 'landing_viewed')::int as visitors,
        count(*) filter (where event_name = 'lead_submitted')::int as leads,
        count(*) filter (where event_name = 'pdf_downloaded')::int as downloads,
        count(*) filter (where event_name = 'assessment_cta_clicked')::int as "ctaClicks",
        count(*) filter (where event_name = 'consultation_submitted')::int as consultations
      from analytics_events where occurred_at >= ${startIso}::timestamptz
    `),
    db.execute(sql`
      select
        count(*) filter (where sent_at >= ${startIso}::timestamptz)::int as sent,
        count(*) filter (where delivered_at >= ${startIso}::timestamptz)::int as delivered,
        count(*) filter (where bounced_at >= ${startIso}::timestamptz)::int as bounced,
        count(*) filter (where complained_at >= ${startIso}::timestamptz)::int as complained
      from lead_magnet_email_jobs
    `),
    db.execute(sql`select count(*)::int as unsubscribed from lead_magnet_leads where marketing_unsubscribed_at >= ${startIso}::timestamptz`),
    db.execute(sql`
      select
        coalesce(nullif(utm_source, ''), '(direct)') as "utmSource",
        coalesce(nullif(utm_medium, ''), '(none)') as "utmMedium",
        coalesce(nullif(utm_campaign, ''), '(none)') as "utmCampaign",
        count(distinct anonymous_id) filter (where event_name = 'landing_viewed')::int as visitors,
        count(*) filter (where event_name = 'lead_submitted')::int as leads,
        count(*) filter (where event_name = 'pdf_downloaded')::int as downloads,
        count(*) filter (where event_name = 'assessment_cta_clicked')::int as "ctaClicks",
        count(*) filter (where event_name = 'consultation_submitted')::int as consultations
      from analytics_events
      where occurred_at >= ${startIso}::timestamptz
      group by 1, 2, 3
      order by leads desc, visitors desc
      limit 50
    `),
  ]);
  const funnel = numeric((funnelResult[0] ?? {}) as FunnelRow);
  const rawEmail = numeric((emailResult[0] ?? {}) as Omit<EmailRow, "unsubscribed">);
  const unsubscribed = Number((unsubscribedResult[0] as { unsubscribed?: number } | undefined)?.unsubscribed ?? 0);
  return {
    start,
    funnel: { visitors: funnel.visitors ?? 0, leads: funnel.leads ?? 0, downloads: funnel.downloads ?? 0, ctaClicks: funnel.ctaClicks ?? 0, consultations: funnel.consultations ?? 0 },
    email: { sent: rawEmail.sent ?? 0, delivered: rawEmail.delivered ?? 0, bounced: rawEmail.bounced ?? 0, complained: rawEmail.complained ?? 0, unsubscribed },
    utm: utmResult.map((row) => numeric(row as UtmRow)),
  };
}
