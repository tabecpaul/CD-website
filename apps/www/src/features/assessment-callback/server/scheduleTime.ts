import { CALLBACK_DURATION_MINUTES, CALLBACK_TIME_ZONE } from "../domain";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;

export function parseKoreaSchedule(date: string, time: string, durationMinutes = CALLBACK_DURATION_MINUTES) {
  const dateMatch = DATE_PATTERN.exec(date);
  const timeMatch = TIME_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) throw new Error("SCHEDULE_INPUT_INVALID");
  const [, rawYear, rawMonth, rawDay] = dateMatch;
  const [, rawHour, rawMinute] = timeMatch;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) throw new Error("SCHEDULE_INPUT_INVALID");
  const start = new Date(Date.UTC(year, month - 1, day, hour, minute) - KOREA_OFFSET_MS);
  const korea = new Date(start.getTime() + KOREA_OFFSET_MS);
  if (korea.getUTCFullYear() !== year || korea.getUTCMonth() + 1 !== month || korea.getUTCDate() !== day || korea.getUTCHours() !== hour || korea.getUTCMinutes() !== minute) {
    throw new Error("SCHEDULE_INPUT_INVALID");
  }
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
}

export function formatKoreaDateTime(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: CALLBACK_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

export function formatKoreaDateInput(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CALLBACK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatKoreaTimeInput(value: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: CALLBACK_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
}

export function schedulesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}
