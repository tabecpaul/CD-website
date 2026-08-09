import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { callbackScheduleTokens, db } from "@newland/db";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueScheduleToken(callbackRequestId: number, scheduleVersion: number, expiresAt: Date) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(callbackScheduleTokens).values({ callbackRequestId, scheduleVersion, tokenHash: tokenHash(token), expiresAt });
  return token;
}

export async function resolveScheduleToken(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return db.query.callbackScheduleTokens.findFirst({
    where: and(eq(callbackScheduleTokens.tokenHash, tokenHash(token)), isNull(callbackScheduleTokens.revokedAt), gt(callbackScheduleTokens.expiresAt, new Date())),
  });
}

export async function revokeScheduleTokens(callbackRequestId: number) {
  await db.update(callbackScheduleTokens).set({ revokedAt: new Date() }).where(and(eq(callbackScheduleTokens.callbackRequestId, callbackRequestId), isNull(callbackScheduleTokens.revokedAt)));
}
