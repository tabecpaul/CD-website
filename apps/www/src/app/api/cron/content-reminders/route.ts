import { processContentReminders } from "@/features/content-operations/server/notifications";
import { completeJobRun, failJobRun, startJobRun } from "@/features/operations-monitor/server/jobRuns";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const runId = await startJobRun("content-reminders");
  try {
    const summary = await processContentReminders();
    if (summary.failed > 0) {
      await failJobRun(runId, new Error("CONTENT_REMINDER_PARTIAL_FAILURE"));
      return Response.json({ error: "notification_failed", ...summary }, { status: 503 });
    }
    await completeJobRun(runId, summary);
    return Response.json({ ok: true, ...summary });
  } catch (error) {
    await failJobRun(runId, error).catch(() => undefined);
    console.error("Content reminder cron failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "content_reminder_failed" }, { status: 500 });
  }
}

