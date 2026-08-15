export const CONTENT_TIME_ZONE = "Asia/Seoul";
const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export function parseKoreaContentSchedule(date: string, time: string) {
  const dateMatch = DATE_PATTERN.exec(date);
  const timeMatch = TIME_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) throw new Error("CONTENT_SCHEDULE_INVALID");
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) throw new Error("CONTENT_SCHEDULE_INVALID");
  const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute) - KOREA_OFFSET_MS);
  const korea = new Date(scheduledAt.getTime() + KOREA_OFFSET_MS);
  if (korea.getUTCFullYear() !== year || korea.getUTCMonth() + 1 !== month || korea.getUTCDate() !== day || korea.getUTCHours() !== hour || korea.getUTCMinutes() !== minute) {
    throw new Error("CONTENT_SCHEDULE_INVALID");
  }
  return scheduledAt;
}

export function formatKoreaContentDateTime(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: CONTENT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

export function koreaDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CONTENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

