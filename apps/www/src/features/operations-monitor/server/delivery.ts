import { createHash } from "node:crypto";
import { and, eq, lt, or } from "drizzle-orm";
import { db, operationsAlertDeliveries } from "@newland/db";
import type { OperationsSnapshot } from "../domain";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export function snapshotFingerprint(snapshot: OperationsSnapshot) {
  const stable = snapshot.issues.map((issue) => `${issue.key}:${issue.count}`).sort().join("|");
  return createHash("sha256").update(stable).digest("hex");
}

export function koreaDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export async function claimAlertDelivery(snapshot: OperationsSnapshot, now = new Date()) {
  const alertDate = koreaDate(now);
  const fingerprint = snapshotFingerprint(snapshot);
  const [inserted] = await db.insert(operationsAlertDeliveries).values({ alertDate, fingerprint, issueCount: snapshot.issueCount }).onConflictDoNothing().returning({ id: operationsAlertDeliveries.id });
  if (inserted) return { claimed: true, duplicate: false, id: inserted.id, fingerprint };

  const existing = await db.query.operationsAlertDeliveries.findFirst({ where: and(eq(operationsAlertDeliveries.alertDate, alertDate), eq(operationsAlertDeliveries.fingerprint, fingerprint)) });
  if (!existing || existing.status === "sent") return { claimed: false, duplicate: true, id: existing?.id ?? null, fingerprint };
  const staleBefore = new Date(now.getTime() - FIFTEEN_MINUTES);
  const [reclaimed] = await db.update(operationsAlertDeliveries).set({ status: "sending", issueCount: snapshot.issueCount, errorCode: null, updatedAt: now }).where(and(
    eq(operationsAlertDeliveries.id, existing.id),
    or(eq(operationsAlertDeliveries.status, "failed"), and(eq(operationsAlertDeliveries.status, "sending"), lt(operationsAlertDeliveries.updatedAt, staleBefore))),
  )).returning({ id: operationsAlertDeliveries.id });
  return { claimed: Boolean(reclaimed), duplicate: !reclaimed, id: reclaimed?.id ?? existing.id, fingerprint };
}

export async function completeAlertDelivery(id: number, result: { ok: true; providerMessageId: string } | { ok: false; errorCode: string }) {
  await db.update(operationsAlertDeliveries).set({
    status: result.ok ? "sent" : "failed",
    providerMessageId: result.ok ? result.providerMessageId : null,
    errorCode: result.ok ? null : result.errorCode.slice(0, 80),
    sentAt: result.ok ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(operationsAlertDeliveries.id, id));
}
