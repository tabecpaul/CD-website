import { processDueEmailJobs } from "@/features/lead-magnet/server/emailAutomation";
import { deleteExpiredAnalyticsEvents, shouldRunAnalyticsRetention } from "@/features/analytics/server/retention";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await processDueEmailJobs(40);
  if (shouldRunAnalyticsRetention()) await deleteExpiredAnalyticsEvents();
  return Response.json({ ok: true, ...summary });
}
