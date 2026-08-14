import { and, eq } from "drizzle-orm";
import { assessmentCallbackRequests, db } from "@newland/db";
import { recordAnalyticsEventSafely } from "@/features/analytics/server/events";
import { optionLabel, timeSlots } from "../domain";
import { sendAdminRescheduleRequestEmail } from "./emails";
import { resolveScheduleToken } from "./scheduleTokens";

export async function getPublicScheduleByToken(token: string) {
  const access = await resolveScheduleToken(token);
  if (!access) return null;
  const request = await db.query.assessmentCallbackRequests.findFirst({
    where: and(eq(assessmentCallbackRequests.id, access.callbackRequestId), eq(assessmentCallbackRequests.scheduleVersion, access.scheduleVersion)),
    columns: { id: true, name: true, contactMethod: true, confirmedStartAt: true, confirmedEndAt: true, scheduleStatus: true, scheduleVersion: true },
  });
  if (!request?.confirmedStartAt || !request.confirmedEndAt || !["confirmed", "reschedule_requested"].includes(request.scheduleStatus)) return null;
  return request;
}

function parseRescheduleInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("RESCHEDULE_INPUT_INVALID");
  const body = value as Record<string, unknown>;
  const allowed = new Set(["preferredDate", "timeSlot", "message"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw new Error("RESCHEDULE_INPUT_INVALID");
  if (typeof body.preferredDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.preferredDate)) throw new Error("RESCHEDULE_INPUT_INVALID");
  if (typeof body.timeSlot !== "string" || !timeSlots.some((item) => item.value === body.timeSlot)) throw new Error("RESCHEDULE_INPUT_INVALID");
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > 500) throw new Error("RESCHEDULE_INPUT_INVALID");
  const koreaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const max = new Date(`${koreaToday}T00:00:00+09:00`);
  max.setUTCDate(max.getUTCDate() + 60);
  if (body.preferredDate < koreaToday || body.preferredDate > new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(max)) throw new Error("RESCHEDULE_INPUT_INVALID");
  return { preferredDate: body.preferredDate, timeSlot: body.timeSlot, message: message || null };
}

export async function requestCallbackReschedule(token: string, value: unknown) {
  const input = parseRescheduleInput(value);
  const access = await resolveScheduleToken(token);
  if (!access) return null;
  const current = await db.query.assessmentCallbackRequests.findFirst({ where: and(eq(assessmentCallbackRequests.id, access.callbackRequestId), eq(assessmentCallbackRequests.scheduleVersion, access.scheduleVersion)) });
  if (!current?.confirmedStartAt || !["confirmed", "reschedule_requested"].includes(current.scheduleStatus)) return null;
  const duplicate = current.scheduleStatus === "reschedule_requested" && current.reschedulePreferredDate === input.preferredDate && current.rescheduleTimeSlot === input.timeSlot && (current.rescheduleMessage ?? null) === input.message;
  if (duplicate) return { duplicate: true };
  const now = new Date();
  const [updated] = await db.update(assessmentCallbackRequests).set({
    scheduleStatus: "reschedule_requested",
    rescheduleRequestedAt: now,
    reschedulePreferredDate: input.preferredDate,
    rescheduleTimeSlot: input.timeSlot,
    rescheduleMessage: input.message,
    updatedAt: now,
  }).where(and(eq(assessmentCallbackRequests.id, current.id), eq(assessmentCallbackRequests.scheduleVersion, access.scheduleVersion))).returning({ id: assessmentCallbackRequests.id });
  if (!updated) return null;
  await sendAdminRescheduleRequestEmail(current.id, { name: current.name, preferredDate: input.preferredDate, timeSlotLabel: optionLabel(timeSlots, input.timeSlot), message: input.message });
  await recordAnalyticsEventSafely({ eventName: "callback_reschedule_requested", path: "/callback-schedule/change" });
  return { duplicate: false };
}
