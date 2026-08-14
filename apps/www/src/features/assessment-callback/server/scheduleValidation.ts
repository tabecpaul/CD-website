import { parseKoreaSchedule } from "./scheduleTime";

export function parseScheduleInput(value: unknown, durationMinutes = 20) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("SCHEDULE_INPUT_INVALID");
  const body = value as Record<string, unknown>;
  const allowed = new Set(["date", "startTime", "conflictConfirmed"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw new Error("SCHEDULE_INPUT_INVALID");
  if (typeof body.date !== "string" || typeof body.startTime !== "string") throw new Error("SCHEDULE_INPUT_INVALID");
  if (body.conflictConfirmed !== undefined && typeof body.conflictConfirmed !== "boolean") throw new Error("SCHEDULE_INPUT_INVALID");
  const schedule = parseKoreaSchedule(body.date, body.startTime, durationMinutes);
  if (schedule.start.getTime() <= Date.now()) throw new Error("SCHEDULE_IN_PAST");
  return { ...schedule, conflictConfirmed: body.conflictConfirmed === true };
}
