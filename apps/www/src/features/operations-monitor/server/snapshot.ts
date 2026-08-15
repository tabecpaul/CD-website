import { sql } from "drizzle-orm";
import { db } from "@newland/db";
import { monitoredJobNames, type OperationsIssue, type OperationsIssueKey, type OperationsSnapshot } from "../domain";
import { latestSuccessfulRuns } from "./jobRuns";

type CountRow = {
  paymentOverdue: number | string;
  paymentEmailFailed: number | string;
  callbackEmailFailed: number | string;
  evidenceNeeded: number | string;
  refundPending: number | string;
  leadEmailDelayed: number | string;
  callbackReminderDelayed: number | string;
  contentNotificationFailed: number | string;
  contentPublishOverdue: number | string;
  firstJobRunAt: Date | string | null;
};

const THIRTY_MINUTES = 30 * 60 * 1000;
const STALE_MS: Record<(typeof monitoredJobNames)[number], number> = {
  "lead-emails": 20 * 60 * 1000,
  "callback-reminders": 20 * 60 * 1000,
  "content-reminders": 30 * 60 * 1000,
  "operations-monitor": 36 * 60 * 60 * 1000,
};

export async function collectOperationsSnapshot(now = new Date()): Promise<OperationsSnapshot> {
  const nowIso = now.toISOString();
  const delayedIso = new Date(now.getTime() - THIRTY_MINUTES).toISOString();
  const result = await db.execute(sql`
    select
      (select count(*) from assessment_callback_payments p join assessment_callback_requests c on c.id = p.callback_request_id where p.is_active = true and c.is_test = false and p.payment_status = 'awaiting_payment' and p.payment_due_at < ${nowIso}::timestamptz)::int as "paymentOverdue",
      (select count(*) from assessment_callback_payments p join assessment_callback_requests c on c.id = p.callback_request_id where p.is_active = true and c.is_test = false and ('failed' in (p.instruction_email_status, coalesce(p.confirmation_email_status, ''), coalesce(p.refund_request_email_status, ''), coalesce(p.refund_completed_email_status, ''))))::int as "paymentEmailFailed",
      (select count(*) from assessment_callback_requests c where c.is_test = false and ('failed' in (c.admin_email_status, c.customer_email_status, coalesce(c.confirmation_email_status, ''))))::int as "callbackEmailFailed",
      (select count(*) from assessment_callback_payments p join assessment_callback_requests c on c.id = p.callback_request_id where p.is_active = true and c.is_test = false and p.evidence_status = 'requested')::int as "evidenceNeeded",
      (select count(*) from assessment_callback_payments p join assessment_callback_requests c on c.id = p.callback_request_id where p.is_active = true and c.is_test = false and p.payment_status = 'refund_pending')::int as "refundPending",
      (select count(*) from lead_magnet_email_jobs where status = 'pending' and scheduled_at < ${delayedIso}::timestamptz)::int as "leadEmailDelayed",
      (select count(*) from callback_schedule_email_jobs where status = 'pending' and scheduled_at < ${delayedIso}::timestamptz)::int as "callbackReminderDelayed",
      (select count(*) from content_notification_deliveries where status = 'failed')::int as "contentNotificationFailed",
      (select count(*) from content_channel_tasks t join content_operation_items i on i.id = t.content_item_id where i.is_test = false and t.status not in ('published', 'performance_checked') and t.scheduled_at < ${delayedIso}::timestamptz)::int as "contentPublishOverdue",
      (select min(created_at) from system_job_runs) as "firstJobRunAt"
  `);
  const row = (result[0] ?? {}) as CountRow;
  const issues: OperationsIssue[] = [];
  const add = (key: OperationsIssueKey, value: number | string | undefined) => {
    const count = Number(value ?? 0);
    if (count > 0) issues.push({ key, count });
  };
  add("payment_overdue", row.paymentOverdue);
  add("payment_email_failed", row.paymentEmailFailed);
  add("callback_email_failed", row.callbackEmailFailed);
  add("evidence_needed", row.evidenceNeeded);
  add("refund_pending", row.refundPending);
  add("lead_email_delayed", row.leadEmailDelayed);
  add("callback_reminder_delayed", row.callbackReminderDelayed);
  add("content_notification_failed", row.contentNotificationFailed);
  add("content_publish_overdue", row.contentPublishOverdue);

  const lastRuns = await latestSuccessfulRuns();
  const firstRunAt = row.firstJobRunAt ? new Date(row.firstJobRunAt) : null;
  const gracePassed = Boolean(firstRunAt && now.getTime() - firstRunAt.getTime() >= THIRTY_MINUTES);
  const staleKey = { "lead-emails": "lead_cron_stale", "callback-reminders": "callback_cron_stale", "content-reminders": "content_cron_stale", "operations-monitor": "monitor_cron_stale" } as const;
  for (const run of lastRuns) {
    const stale = run.completedAt ? now.getTime() - run.completedAt.getTime() > STALE_MS[run.jobName] : gracePassed;
    if (stale) issues.push({ key: staleKey[run.jobName], count: 1 });
  }

  issues.sort((a, b) => a.key.localeCompare(b.key));
  return {
    checkedAt: nowIso,
    issues,
    issueCount: issues.reduce((sum, issue) => sum + issue.count, 0),
    lastSuccess: lastRuns.map((run) => ({ jobName: run.jobName, completedAt: run.completedAt?.toISOString() ?? null })),
  };
}
