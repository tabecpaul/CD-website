import { and, eq, lte } from "drizzle-orm";
import { assessmentCallbackRequests, callbackScheduleEmailJobs, db } from "@newland/db";
import { recordAnalyticsEventSafely } from "@/features/analytics/server/events";
import { sendScheduleReminderEmail } from "./emails";
import { scheduleLinks } from "./scheduleLinks";
import { issueScheduleToken } from "./scheduleTokens";
import { callbackDurationMinutes, normalizeContactMethod } from "../domain";

export async function processDueCallbackReminders(limit = 40) {
  const jobs = await db.query.callbackScheduleEmailJobs.findMany({
    where: and(eq(callbackScheduleEmailJobs.status, "pending"), lte(callbackScheduleEmailJobs.scheduledAt, new Date())),
    orderBy: (table, { asc }) => [asc(table.scheduledAt)],
    limit,
  });
  const summary = { sent: 0, skipped: 0, failed: 0 };
  for (const job of jobs) {
    const claimed = await db.update(callbackScheduleEmailJobs).set({ status: "processing", updatedAt: new Date() }).where(and(eq(callbackScheduleEmailJobs.id, job.id), eq(callbackScheduleEmailJobs.status, "pending"))).returning({ id: callbackScheduleEmailJobs.id });
    if (!claimed.length) continue;
    const request = await db.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, job.callbackRequestId) });
    if (!request?.confirmedStartAt || !request.confirmedEndAt || request.scheduleVersion !== job.scheduleVersion || !["confirmed", "reschedule_requested"].includes(request.scheduleStatus) || request.confirmedStartAt <= new Date()) {
      await db.update(callbackScheduleEmailJobs).set({ status: "skipped", updatedAt: new Date() }).where(eq(callbackScheduleEmailJobs.id, job.id));
      summary.skipped++;
      continue;
    }
    try {
      const contactMethod = normalizeContactMethod(request.contactMethod);
      if (contactMethod === "direct_assessment") {
        await db.update(callbackScheduleEmailJobs).set({ status: "skipped", updatedAt: new Date() }).where(eq(callbackScheduleEmailJobs.id, job.id));
        summary.skipped++;
        continue;
      }
      const durationMinutes = callbackDurationMinutes(contactMethod);
      if (durationMinutes === null) {
        await db.update(callbackScheduleEmailJobs).set({ status: "skipped", updatedAt: new Date() }).where(eq(callbackScheduleEmailJobs.id, job.id));
        summary.skipped++;
        continue;
      }
      const token = await issueScheduleToken(request.id, request.scheduleVersion, new Date(request.confirmedEndAt.getTime() + 24 * 60 * 60_000));
      const links = scheduleLinks(token, request.confirmedStartAt, request.confirmedEndAt, contactMethod, durationMinutes);
      const result = await sendScheduleReminderEmail({ name: request.name, email: request.email, phone: request.phone, start: request.confirmedStartAt, end: request.confirmedEndAt, contactMethod, durationMinutes, ...links });
      if (!result.ok) {
        const error = new Error(result.errorCode);
        error.name = result.errorCode;
        throw error;
      }
      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.update(callbackScheduleEmailJobs).set({ status: "sent", providerMessageId: result.providerMessageId, sentAt: now, lastErrorCode: null, updatedAt: now }).where(eq(callbackScheduleEmailJobs.id, job.id));
        await tx.update(assessmentCallbackRequests).set({ reminderEmailSentAt: now, updatedAt: now }).where(and(eq(assessmentCallbackRequests.id, request.id), eq(assessmentCallbackRequests.scheduleVersion, job.scheduleVersion)));
      });
      await recordAnalyticsEventSafely({ eventName: "callback_reminder_sent", path: "/api/cron/callback-reminders" });
      summary.sent++;
    } catch (error) {
      const attempts = job.attempts + 1;
      const code = error instanceof Error ? (error.name || error.message).slice(0, 80) : "UNKNOWN";
      console.error("Callback reminder send failed", { jobId: job.id, errorCode: code });
      await db.update(callbackScheduleEmailJobs).set({ status: attempts >= 5 ? "failed" : "pending", attempts, lastErrorCode: code, updatedAt: new Date() }).where(eq(callbackScheduleEmailJobs.id, job.id));
      summary.failed++;
    }
  }
  return summary;
}
