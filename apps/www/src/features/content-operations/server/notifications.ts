import { and, eq, lt, or } from "drizzle-orm";
import { contentChannelTasks, contentNotificationDeliveries, contentOperationItems, db } from "@newland/db";
import { contentNotificationKinds, type ContentChannel, type ContentNotificationKind } from "../domain";
import { koreaDateKey, parseKoreaContentSchedule } from "./time";
import { sendContentReminderEmail } from "./email";

const RETRY_AFTER_MS = 15 * 60_000;

function notificationAt(scheduledAt: Date, kind: ContentNotificationKind) {
  if (kind === "publish_soon") return new Date(scheduledAt.getTime() - 30 * 60_000);
  const shifted = new Date(scheduledAt.getTime() + (kind === "day_before" ? -24 : 24) * 60 * 60_000);
  return parseKoreaContentSchedule(koreaDateKey(shifted), "09:00");
}

function eligibleWindow(kind: ContentNotificationKind) {
  return kind === "publish_soon" ? 2 * 60 * 60_000 : 36 * 60 * 60_000;
}

async function claimDelivery(input: { taskId: number; kind: ContentNotificationKind; scheduledAt: Date; key: string }, now: Date) {
  const [inserted] = await db.insert(contentNotificationDeliveries).values({ channelTaskId: input.taskId, kind: input.kind, deduplicationKey: input.key, scheduledAt: input.scheduledAt, attempts: 1 }).onConflictDoNothing().returning({ id: contentNotificationDeliveries.id });
  if (inserted) return inserted.id;
  const existing = await db.query.contentNotificationDeliveries.findFirst({ where: eq(contentNotificationDeliveries.deduplicationKey, input.key) });
  if (!existing || existing.status === "sent" || existing.attempts >= 3) return null;
  const staleBefore = new Date(now.getTime() - RETRY_AFTER_MS);
  const [reclaimed] = await db.update(contentNotificationDeliveries).set({ status: "sending", attempts: existing.attempts + 1, errorCode: null, updatedAt: now }).where(and(eq(contentNotificationDeliveries.id, existing.id), or(eq(contentNotificationDeliveries.status, "failed"), and(eq(contentNotificationDeliveries.status, "sending"), lt(contentNotificationDeliveries.updatedAt, staleBefore))))).returning({ id: contentNotificationDeliveries.id });
  return reclaimed?.id ?? null;
}

export async function processContentReminders(now = new Date()) {
  const rows = await db.select({ item: contentOperationItems, task: contentChannelTasks }).from(contentOperationItems).innerJoin(contentChannelTasks, eq(contentChannelTasks.contentItemId, contentOperationItems.id));
  let candidates = 0; let sent = 0; let failed = 0; let duplicate = 0;
  for (const row of rows) {
    if (row.item.isTest) continue;
    const channel = row.task.channel as ContentChannel;
    for (const kind of contentNotificationKinds) {
      if ((kind === "day_before" || kind === "performance_followup") && channel !== "naver_blog") continue;
      if (kind === "publish_soon" && channel === "facebook") continue;
      if (kind === "publish_soon" && (row.task.status === "published" || row.task.status === "performance_checked")) continue;
      const dueAt = notificationAt(row.task.scheduledAt, kind);
      const lateness = now.getTime() - dueAt.getTime();
      if (lateness < 0 || lateness > eligibleWindow(kind)) continue;
      candidates += 1;
      const combinedMeta = kind === "publish_soon" && channel === "instagram";
      const key = `${row.item.slug}:${kind}:${channel}:${koreaDateKey(dueAt)}`;
      const deliveryId = await claimDelivery({ taskId: row.task.id, kind, scheduledAt: dueAt, key }, now);
      if (!deliveryId) { duplicate += 1; continue; }
      const result = await sendContentReminderEmail({ itemId: row.item.id, title: row.item.title, channel, kind, scheduledAt: row.task.scheduledAt, combinedMeta });
      await db.update(contentNotificationDeliveries).set({ status: result.ok ? "sent" : "failed", providerMessageId: result.ok ? result.providerMessageId : null, errorCode: result.ok ? null : result.errorCode.slice(0, 80), sentAt: result.ok ? now : null, updatedAt: now }).where(eq(contentNotificationDeliveries.id, deliveryId));
      if (result.ok) sent += 1; else failed += 1;
    }
  }
  return { candidates, sent, failed, duplicate };
}
