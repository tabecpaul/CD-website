import { callbackCalendarIcs } from "@/features/assessment-callback/server/calendar";
import { getPublicScheduleByToken } from "@/features/assessment-callback/server/reschedule";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const schedule = await getPublicScheduleByToken((await params).token);
  if (!schedule?.confirmedStartAt || !schedule.confirmedEndAt) return new Response("Not found", { status: 404 });
  const body = callbackCalendarIcs({ start: schedule.confirmedStartAt, end: schedule.confirmedEndAt, uid: `callback-${schedule.id}-v${schedule.scheduleVersion}` });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=career-direct-callback.ics",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
