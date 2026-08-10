import { processDueCallbackReminders } from "@/features/assessment-callback/server/scheduleAutomation";
import { completeJobRun, failJobRun, startJobRun } from "@/features/operations-monitor/server/jobRuns";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const runId = await startJobRun("callback-reminders");
  try {
    const summary = await processDueCallbackReminders(40);
    await completeJobRun(runId, summary);
    return Response.json({ ok: true, ...summary });
  } catch (error) {
    await failJobRun(runId, error).catch(() => undefined);
    console.error("Callback reminder cron failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "cron_failed" }, { status: 500 });
  }
}
