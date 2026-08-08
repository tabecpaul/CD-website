import { and, eq, ne, sql } from "drizzle-orm";
import {
  db,
  leadMagnetEmailEvents,
  leadMagnetEmailJobs,
  leadMagnetLeads,
} from "@newland/db";

type SesEvent = {
  type: string;
  subtype: string | null;
  providerMessageId: string;
  eventAt: Date;
  bounceType: string | null;
  hintedJobId: number | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function dateValue(value: unknown) {
  if (typeof value !== "string") return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function parseSesEvent(rawMessage: string): SesEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawMessage);
  } catch {
    throw new Error("SES_EVENT_JSON_INVALID");
  }
  const body = record(parsed);
  const mail = record(body?.mail);
  const providerMessageId = mail?.messageId;
  const rawType = body?.eventType ?? body?.notificationType;
  if (typeof providerMessageId !== "string" || !providerMessageId || typeof rawType !== "string") {
    throw new Error("SES_EVENT_FIELDS_INVALID");
  }
  const type = rawType.toLowerCase();
  const bounce = record(body?.bounce);
  const complaint = record(body?.complaint);
  const delivery = record(body?.delivery);
  const tags = record(mail?.tags);
  const rawJobTag = Array.isArray(tags?.job_id) ? tags.job_id[0] : null;
  const parsedJobId = typeof rawJobTag === "string" ? Number(rawJobTag) : Number.NaN;
  const hintedJobId = Number.isSafeInteger(parsedJobId) && parsedJobId > 0 ? parsedJobId : null;
  if (type === "bounce") {
    return {
      type,
      subtype: typeof bounce?.bounceSubType === "string" ? bounce.bounceSubType : null,
      providerMessageId,
      eventAt: dateValue(bounce?.timestamp),
      bounceType: typeof bounce?.bounceType === "string" ? bounce.bounceType : null,
      hintedJobId,
    };
  }
  if (type === "complaint") {
    return {
      type,
      subtype: typeof complaint?.complaintFeedbackType === "string"
        ? complaint.complaintFeedbackType
        : typeof complaint?.complaintSubType === "string" ? complaint.complaintSubType : null,
      providerMessageId,
      eventAt: dateValue(complaint?.timestamp),
      bounceType: null,
      hintedJobId,
    };
  }
  if (type === "delivery") {
    return {
      type,
      subtype: null,
      providerMessageId,
      eventAt: dateValue(delivery?.timestamp),
      bounceType: null,
      hintedJobId,
    };
  }
  return {
    type,
    subtype: null,
    providerMessageId,
    eventAt: dateValue(mail?.timestamp),
    bounceType: null,
    hintedJobId,
  };
}

async function suppressLead(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  leadId: number,
  reason: "permanent_bounce" | "complaint" | "transient_bounce_limit",
  eventAt: Date,
) {
  await tx.update(leadMagnetLeads).set({
    coachingAgreed: false,
    emailSuppressedAt: eventAt,
    emailSuppressionReason: reason,
    updatedAt: new Date(),
  }).where(eq(leadMagnetLeads.id, leadId));
  await tx.update(leadMagnetEmailJobs).set({
    status: "skipped",
    updatedAt: new Date(),
  }).where(and(
    eq(leadMagnetEmailJobs.leadId, leadId),
    ne(leadMagnetEmailJobs.kind, "delivery"),
    eq(leadMagnetEmailJobs.status, "pending"),
  ));
}

export async function processSesFeedback(snsMessageId: string, rawMessage: string) {
  const event = parseSesEvent(rawMessage);
  return db.transaction(async (tx) => {
    const [claimed] = await tx.insert(leadMagnetEmailEvents).values({
      snsMessageId,
      providerMessageId: event.providerMessageId,
      eventType: event.type,
      eventSubtype: event.subtype,
      eventAt: event.eventAt,
    }).onConflictDoNothing().returning({ id: leadMagnetEmailEvents.id });
    if (!claimed) return { duplicate: true, matched: false, eventType: event.type };

    let job = await tx.query.leadMagnetEmailJobs.findFirst({
      where: eq(leadMagnetEmailJobs.providerMessageId, event.providerMessageId),
      columns: { id: true, leadId: true },
    });
    if (!job && event.hintedJobId) {
      job = await tx.query.leadMagnetEmailJobs.findFirst({
        where: eq(leadMagnetEmailJobs.id, event.hintedJobId),
        columns: { id: true, leadId: true },
      });
    }
    if (!job) return { duplicate: false, matched: false, eventType: event.type };

    await tx.update(leadMagnetEmailJobs).set({
      providerMessageId: event.providerMessageId,
      updatedAt: new Date(),
    }).where(eq(leadMagnetEmailJobs.id, job.id));

    await tx.update(leadMagnetEmailEvents).set({
      jobId: job.id,
      leadId: job.leadId,
    }).where(eq(leadMagnetEmailEvents.id, claimed.id));

    if (event.type === "delivery") {
      await tx.update(leadMagnetEmailJobs).set({
        deliveredAt: event.eventAt,
        updatedAt: new Date(),
      }).where(eq(leadMagnetEmailJobs.id, job.id));
    } else if (event.type === "complaint") {
      await tx.update(leadMagnetEmailJobs).set({
        complainedAt: event.eventAt,
        updatedAt: new Date(),
      }).where(eq(leadMagnetEmailJobs.id, job.id));
      await suppressLead(tx, job.leadId, "complaint", event.eventAt);
    } else if (event.type === "bounce") {
      await tx.update(leadMagnetEmailJobs).set({
        bouncedAt: event.eventAt,
        updatedAt: new Date(),
      }).where(eq(leadMagnetEmailJobs.id, job.id));
      if (event.bounceType === "Permanent") {
        await suppressLead(tx, job.leadId, "permanent_bounce", event.eventAt);
      } else if (event.bounceType === "Transient") {
        const [lead] = await tx.update(leadMagnetLeads).set({
          transientBounceCount: sql`${leadMagnetLeads.transientBounceCount} + 1`,
          updatedAt: new Date(),
        }).where(eq(leadMagnetLeads.id, job.leadId)).returning({
          count: leadMagnetLeads.transientBounceCount,
        });
        if (lead && lead.count >= 3) {
          await suppressLead(tx, job.leadId, "transient_bounce_limit", event.eventAt);
        }
      }
    }
    return { duplicate: false, matched: true, eventType: event.type };
  });
}
