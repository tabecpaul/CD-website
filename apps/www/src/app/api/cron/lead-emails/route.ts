import { processDueEmailJobs } from "@/features/lead-magnet/server/emailAutomation";
import { deleteExpiredAnalyticsEvents, shouldRunAnalyticsRetention } from "@/features/analytics/server/retention";
import { completeJobRun, failJobRun, startJobRun } from "@/features/operations-monitor/server/jobRuns";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const runId = await startJobRun("lead-emails");
  try {
    const summary = await processDueEmailJobs(40);
    if (shouldRunAnalyticsRetention()) await deleteExpiredAnalyticsEvents();
    await completeJobRun(runId, summary);
    return Response.json({ ok: true, ...summary });
  } catch (error) {
    await failJobRun(runId, error).catch(() => undefined);
    console.error("Lead email cron failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "cron_failed" }, { status: 500 });
  }
}
