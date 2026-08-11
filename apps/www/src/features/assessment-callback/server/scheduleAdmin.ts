import { and, eq, gt, inArray, isNull, lt, ne } from "drizzle-orm";
import { assessmentCallbackRequests, callbackScheduleEmailJobs, callbackScheduleTokens, db } from "@newland/db";
import { recordAnalyticsEventSafely } from "@/features/analytics/server/events";
import { sendScheduleConfirmationEmail } from "./emails";
import { scheduleLinks } from "./scheduleLinks";
import { issueScheduleToken } from "./scheduleTokens";

const ACTIVE_SCHEDULES = ["confirmed", "reschedule_requested"];

export async function findScheduleConflicts(id: number, start: Date, end: Date) {
  return db.query.assessmentCallbackRequests.findMany({
    where: and(
      ne(assessmentCallbackRequests.id, id),
      inArray(assessmentCallbackRequests.scheduleStatus, ACTIVE_SCHEDULES),
      lt(assessmentCallbackRequests.confirmedStartAt, end),
      gt(assessmentCallbackRequests.confirmedEndAt, start),
    ),
    columns: { id: true, confirmedStartAt: true, confirmedEndAt: true },
    limit: 5,
  });
}

async function sendConfirmationForCurrentSchedule(id: number, reconfirmed: boolean) {
  const request = await db.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, id) });
  if (!request?.confirmedStartAt || !request.confirmedEndAt || !ACTIVE_SCHEDULES.includes(request.scheduleStatus)) return null;
  const expiresAt = new Date(request.confirmedEndAt.getTime() + 24 * 60 * 60_000);
  const token = await issueScheduleToken(id, request.scheduleVersion, expiresAt);
  const links = scheduleLinks(token, request.confirmedStartAt, request.confirmedEndAt);
  const result = await sendScheduleConfirmationEmail({
    name: request.name,
    email: request.email,
    phone: request.phone,
    start: request.confirmedStartAt,
    end: request.confirmedEndAt,
    ...links,
    reconfirmed,
  });
  const now = new Date();
  await db.update(assessmentCallbackRequests).set({
    confirmationEmailStatus: result.ok ? "sent" : "failed",
    confirmationEmailId: result.ok ? result.providerMessageId : null,
    confirmationEmailError: result.ok ? null : result.errorCode,
    confirmationEmailSentAt: result.ok ? now : null,
    updatedAt: now,
  }).where(and(eq(assessmentCallbackRequests.id, id), eq(assessmentCallbackRequests.scheduleVersion, request.scheduleVersion)));
  return result;
}

export async function confirmCallbackSchedule(id: number, start: Date, end: Date, conflictConfirmed: boolean) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const conflicts = await findScheduleConflicts(id, start, end);
  if (conflicts.length && !conflictConfirmed) return { kind: "conflict" as const, conflicts };
  const current = await db.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, id) });
  if (!current) return null;
  const nextVersion = current.scheduleVersion + 1;
  const reconfirmed = current.scheduleVersion > 0;
  const now = new Date();
  await db.transaction(async (tx) => {
    const [updated] = await tx.update(assessmentCallbackRequests).set({
      scheduleStatus: "confirmed",
      confirmedStartAt: start,
      confirmedEndAt: end,
      scheduleVersion: nextVersion,
      status: current.status === "new" ? "scheduled" : current.status,
      statusUpdatedAt: current.status === "new" ? now : current.statusUpdatedAt,
      confirmationEmailStatus: "pending",
      confirmationEmailId: null,
      confirmationEmailError: null,
      confirmationEmailSentAt: null,
      reminderEmailSentAt: null,
      rescheduleRequestedAt: null,
      reschedulePreferredDate: null,
      rescheduleTimeSlot: null,
      rescheduleMessage: null,
      updatedAt: now,
    }).where(and(eq(assessmentCallbackRequests.id, id), eq(assessmentCallbackRequests.scheduleVersion, current.scheduleVersion))).returning({ id: assessmentCallbackRequests.id });
    if (!updated) throw new Error("SCHEDULE_VERSION_CONFLICT");
    await tx.update(callbackScheduleEmailJobs).set({ status: "skipped", updatedAt: now }).where(and(eq(callbackScheduleEmailJobs.callbackRequestId, id), eq(callbackScheduleEmailJobs.status, "pending")));
    await tx.update(callbackScheduleTokens).set({ revokedAt: now }).where(and(eq(callbackScheduleTokens.callbackRequestId, id), isNull(callbackScheduleTokens.revokedAt)));
    if (start.getTime() - now.getTime() > 24 * 60 * 60_000) {
      await tx.insert(callbackScheduleEmailJobs).values({
        callbackRequestId: id,
        scheduleVersion: nextVersion,
        kind: "reminder_24h",
        scheduledAt: new Date(start.getTime() - 24 * 60 * 60_000),
      }).onConflictDoNothing();
    }
  });
  let email: Awaited<ReturnType<typeof sendConfirmationForCurrentSchedule>>;
  try {
    email = await sendConfirmationForCurrentSchedule(id, reconfirmed);
  } catch (error) {
    const errorCode = error instanceof Error ? error.name.slice(0, 80) : "SCHEDULE_EMAIL_FAILED";
    await db.update(assessmentCallbackRequests).set({ confirmationEmailStatus: "failed", confirmationEmailError: errorCode, updatedAt: new Date() }).where(and(eq(assessmentCallbackRequests.id, id), eq(assessmentCallbackRequests.scheduleVersion, nextVersion)));
    console.error("Schedule saved but confirmation email preparation failed", { callbackRequestId: id, errorCode });
    email = { ok: false, errorCode };
  }
  await recordAnalyticsEventSafely({ eventName: reconfirmed ? "callback_schedule_reconfirmed" : "callback_schedule_confirmed", path: `/admin/callbacks/${id}` });
  return { kind: "confirmed" as const, email };
}

export async function resendScheduleConfirmation(id: number) {
  const request = await db.query.assessmentCallbackRequests.findFirst({
    where: eq(assessmentCallbackRequests.id, id),
    columns: { scheduleVersion: true },
  });
  return sendConfirmationForCurrentSchedule(id, (request?.scheduleVersion ?? 0) > 1);
}

export async function updateScheduleStatus(id: number, action: "complete" | "cancel" | "keep_existing") {
  const request = await db.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, id) });
  if (!request) return null;
  const now = new Date();
  if (action === "keep_existing") {
    if (!request.confirmedStartAt || !request.confirmedEndAt) throw new Error("SCHEDULE_ACTION_INVALID");
    await db.update(assessmentCallbackRequests).set({ scheduleStatus: "confirmed", rescheduleRequestedAt: null, reschedulePreferredDate: null, rescheduleTimeSlot: null, rescheduleMessage: null, updatedAt: now }).where(eq(assessmentCallbackRequests.id, id));
    return { ok: true };
  }
  const scheduleStatus = action === "complete" ? "completed" : "cancelled";
  await db.transaction(async (tx) => {
    await tx.update(assessmentCallbackRequests).set({
      scheduleStatus,
      status: action === "complete" && request.status === "scheduled" ? "callback_completed" : request.status,
      statusUpdatedAt: action === "complete" && request.status === "scheduled" ? now : request.statusUpdatedAt,
      updatedAt: now,
    }).where(eq(assessmentCallbackRequests.id, id));
    await tx.update(callbackScheduleEmailJobs).set({ status: "skipped", updatedAt: now }).where(and(eq(callbackScheduleEmailJobs.callbackRequestId, id), eq(callbackScheduleEmailJobs.status, "pending")));
    await tx.update(callbackScheduleTokens).set({ revokedAt: now }).where(and(eq(callbackScheduleTokens.callbackRequestId, id), isNull(callbackScheduleTokens.revokedAt)));
  });
  return { ok: true };
}
