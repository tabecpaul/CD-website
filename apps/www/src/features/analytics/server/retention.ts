import { lt } from "drizzle-orm";
import { analyticsEvents, db } from "@newland/db";

export async function deleteExpiredAnalyticsEvents(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 13);
  await db.delete(analyticsEvents).where(lt(analyticsEvents.occurredAt, cutoff));
}

export function shouldRunAnalyticsRetention(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  return kst.getUTCHours() === 3 && kst.getUTCMinutes() < 5;
}
