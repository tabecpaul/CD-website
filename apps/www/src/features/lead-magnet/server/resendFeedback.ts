import { and, eq, ne } from "drizzle-orm";
import {
  db,
  leadMagnetEmailEvents,
  leadMagnetEmailJobs,
  leadMagnetLeads,
} from "@newland/db";

export type ResendEmailEvent = {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    tags?: Record<string, string>;
  };
};

function eventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function suppressLead(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  leadId: number,
  reason: "permanent_bounce" | "complaint",
  at: Date,
) {
  await tx.update(leadMagnetLeads).set({
    coachingAgreed: false,
    emailSuppressedAt: at,
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

export async function processResendFeedback(eventId: string, event: ResendEmailEvent) {
  const providerMessageId = event.data.email_id;
  if (!providerMessageId || !event.type.startsWith("email.")) {
    throw new Error("RESEND_EVENT_FIELDS_INVALID");
  }
  const eventAt = eventDate(event.created_at);
  const eventType = event.type.slice("email.".length);
  const hintedJobId = Number(event.data.tags?.job_id);

  return db.transaction(async (tx) => {
    const [claimed] = await tx.insert(leadMagnetEmailEvents).values({
      snsMessageId: eventId,
      providerMessageId,
      eventType,
      eventAt,
    }).onConflictDoNothing().returning({ id: leadMagnetEmailEvents.id });
    if (!claimed) return { duplicate: true, matched: false, eventType };

    let job = await tx.query.leadMagnetEmailJobs.findFirst({
      where: eq(leadMagnetEmailJobs.providerMessageId, providerMessageId),
      columns: { id: true, leadId: true },
    });
    if (!job && Number.isSafeInteger(hintedJobId) && hintedJobId > 0) {
      job = await tx.query.leadMagnetEmailJobs.findFirst({
        where: eq(leadMagnetEmailJobs.id, hintedJobId),
        columns: { id: true, leadId: true },
      });
    }
    if (!job) return { duplicate: false, matched: false, eventType };

    await tx.update(leadMagnetEmailEvents).set({
      jobId: job.id,
      leadId: job.leadId,
    }).where(eq(leadMagnetEmailEvents.id, claimed.id));

    if (eventType === "delivered") {
      await tx.update(leadMagnetEmailJobs).set({ deliveredAt: eventAt, updatedAt: new Date() })
        .where(eq(leadMagnetEmailJobs.id, job.id));
    } else if (eventType === "bounced") {
      await tx.update(leadMagnetEmailJobs).set({ bouncedAt: eventAt, updatedAt: new Date() })
        .where(eq(leadMagnetEmailJobs.id, job.id));
      await suppressLead(tx, job.leadId, "permanent_bounce", eventAt);
    } else if (eventType === "complained") {
      await tx.update(leadMagnetEmailJobs).set({ complainedAt: eventAt, updatedAt: new Date() })
        .where(eq(leadMagnetEmailJobs.id, job.id));
      await suppressLead(tx, job.leadId, "complaint", eventAt);
    } else if (eventType === "failed") {
      await tx.update(leadMagnetEmailJobs).set({ lastErrorCode: "RESEND_DELIVERY_FAILED", updatedAt: new Date() })
        .where(eq(leadMagnetEmailJobs.id, job.id));
    } else if (eventType === "delivery_delayed") {
      await tx.update(leadMagnetEmailJobs).set({ lastErrorCode: "RESEND_DELIVERY_DELAYED", updatedAt: new Date() })
        .where(eq(leadMagnetEmailJobs.id, job.id));
    }

    return { duplicate: false, matched: true, eventType };
  });
}
