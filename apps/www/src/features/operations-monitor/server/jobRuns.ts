import { and, desc, eq, inArray } from "drizzle-orm";
import { db, systemJobRuns } from "@newland/db";
import { monitoredJobNames, type MonitoredJobName } from "../domain";

function safeErrorCode(value: unknown) {
  return value instanceof Error ? (value.message || value.name).slice(0, 80) : "JOB_FAILED";
}

export async function startJobRun(jobName: MonitoredJobName) {
  if (!monitoredJobNames.includes(jobName)) throw new Error("JOB_NAME_INVALID");
  const [run] = await db.insert(systemJobRuns).values({ jobName }).returning({ id: systemJobRuns.id });
  return run.id;
}

export async function completeJobRun(id: number, summary: Record<string, number | string | null> = {}) {
  await db.update(systemJobRuns).set({ status: "succeeded", completedAt: new Date(), summary, errorCode: null }).where(and(eq(systemJobRuns.id, id), eq(systemJobRuns.status, "running")));
}

export async function failJobRun(id: number, error: unknown) {
  await db.update(systemJobRuns).set({ status: "failed", completedAt: new Date(), errorCode: safeErrorCode(error) }).where(and(eq(systemJobRuns.id, id), eq(systemJobRuns.status, "running")));
}

export async function latestSuccessfulRuns(jobNames: readonly MonitoredJobName[] = monitoredJobNames) {
  const rows = await db.query.systemJobRuns.findMany({
    where: and(inArray(systemJobRuns.jobName, [...jobNames]), eq(systemJobRuns.status, "succeeded")),
    orderBy: [desc(systemJobRuns.completedAt)],
    limit: 100,
  });
  return jobNames.map((jobName) => ({ jobName, completedAt: rows.find((row) => row.jobName === jobName)?.completedAt ?? null }));
}
