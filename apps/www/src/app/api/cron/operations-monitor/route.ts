import { claimAlertDelivery, completeAlertDelivery } from "@/features/operations-monitor/server/delivery";
import { sendOperationsAlertEmail } from "@/features/operations-monitor/server/email";
import { completeJobRun, failJobRun, startJobRun } from "@/features/operations-monitor/server/jobRuns";
import { collectOperationsSnapshot } from "@/features/operations-monitor/server/snapshot";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });

  const runId = await startJobRun("operations-monitor");
  try {
    const snapshot = await collectOperationsSnapshot();
    if (snapshot.issueCount === 0) {
      await completeJobRun(runId, { issueCount: 0, notified: "no" });
      return Response.json({ ok: true, issueCount: 0, notified: false, duplicate: false });
    }
    const claim = await claimAlertDelivery(snapshot);
    if (!claim.claimed || !claim.id) {
      await completeJobRun(runId, { issueCount: snapshot.issueCount, notified: "no", duplicate: "yes" });
      return Response.json({ ok: true, issueCount: snapshot.issueCount, notified: false, duplicate: true });
    }
    const email = await sendOperationsAlertEmail(snapshot);
    await completeAlertDelivery(claim.id, email);
    if (!email.ok) {
      await failJobRun(runId, new Error(email.errorCode));
      return Response.json({ error: "notification_failed", issueCount: snapshot.issueCount }, { status: 503 });
    }
    await completeJobRun(runId, { issueCount: snapshot.issueCount, notified: "yes" });
    return Response.json({ ok: true, issueCount: snapshot.issueCount, notified: true, duplicate: false });
  } catch (error) {
    await failJobRun(runId, error).catch(() => undefined);
    console.error("Operations monitor cron failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "monitor_failed" }, { status: 500 });
  }
}
