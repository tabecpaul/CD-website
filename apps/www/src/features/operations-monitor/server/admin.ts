import { desc, eq } from "drizzle-orm";
import { db, systemJobRuns } from "@newland/db";
import { collectOperationsSnapshot } from "./snapshot";

export async function getOperationsAdminStatus() {
  const [snapshot, latestRun, latestSuccess] = await Promise.all([
    collectOperationsSnapshot(),
    db.query.systemJobRuns.findFirst({ where: eq(systemJobRuns.jobName, "operations-monitor"), orderBy: [desc(systemJobRuns.startedAt)] }),
    db.query.systemJobRuns.findFirst({ where: (table, { and }) => and(eq(table.jobName, "operations-monitor"), eq(table.status, "succeeded")), orderBy: [desc(systemJobRuns.completedAt)] }),
  ]);
  const stale = !latestSuccess?.completedAt || Date.now() - latestSuccess.completedAt.getTime() > 36 * 60 * 60 * 1000;
  return { snapshot, latestStatus: latestRun?.status ?? null, latestCompletedAt: latestRun?.completedAt ?? null, latestSuccessAt: latestSuccess?.completedAt ?? null, stale };
}
