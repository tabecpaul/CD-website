import { googleCalendarUrl } from "./calendar";

export function scheduleLinks(token: string, start: Date, end: Date) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr").replace(/\/$/, "");
  const encoded = encodeURIComponent(token);
  return {
    googleCalendarUrl: googleCalendarUrl(start, end),
    icsUrl: `${siteUrl}/api/callback-schedule/calendar/${encoded}`,
    rescheduleUrl: `${siteUrl}/callback-schedule/change/${encoded}`,
  };
}
