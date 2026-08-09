import { desc, eq } from "drizzle-orm";
import { assessmentCallbackRequests, callbackPaymentAuditLogs, db } from "@newland/db";
import { auditValues } from "@/features/callback-payment/server/audit";
import { callbackStatuses, type CallbackStatus } from "../domain";
import { sendAdminCallbackEmail, sendCustomerCallbackEmail } from "./emails";

export async function listCallbackRequests(status?: string) {
  const safeStatus = callbackStatuses.includes(status as CallbackStatus) ? status : undefined;
  return db.query.assessmentCallbackRequests.findMany({
    where: safeStatus ? eq(assessmentCallbackRequests.status, safeStatus) : undefined,
    orderBy: [desc(assessmentCallbackRequests.createdAt)],
    limit: 100,
  });
}

export async function getCallbackRequest(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return db.query.assessmentCallbackRequests.findFirst({
    where: eq(assessmentCallbackRequests.id, id),
  });
}

export async function updateCallbackRequest(id: number, input: { status: unknown; adminNote: unknown }) {
  const status = typeof input.status === "string" && callbackStatuses.includes(input.status as CallbackStatus)
    ? input.status as CallbackStatus
    : null;
  const adminNote = typeof input.adminNote === "string" ? input.adminNote.trim() : "";
  if (!status || adminNote.length > 2_000) throw new Error("CALLBACK_UPDATE_INVALID");
  const current = await getCallbackRequest(id);
  if (!current) return null;
  const now = new Date();
  const [updated] = await db.update(assessmentCallbackRequests).set({
    status,
    adminNote: adminNote || null,
    statusUpdatedAt: status === current.status ? current.statusUpdatedAt : now,
    updatedAt: now,
  }).where(eq(assessmentCallbackRequests.id, id)).returning();
  return updated;
}

export async function setCallbackTestStatus(id: number, input: { isTest: unknown; reason: unknown }) {
  if (typeof input.isTest !== "boolean") throw new Error("CALLBACK_UPDATE_INVALID");
  const isTest = input.isTest;
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (reason.length > 500) throw new Error("CALLBACK_UPDATE_INVALID");
  return db.transaction(async (tx) => {
    const current = await tx.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, id) });
    if (!current) return null;
    if (current.isTest === isTest) return current;
    const [updated] = await tx.update(assessmentCallbackRequests).set({ isTest, updatedAt: new Date() }).where(eq(assessmentCallbackRequests.id, id)).returning();
    await tx.insert(callbackPaymentAuditLogs).values(auditValues({ callbackRequestId: id, action: "test_status_changed", previousStatus: current.isTest ? "test" : "real", nextStatus: isTest ? "test" : "real", reason }));
    return updated;
  });
}

export async function resendCallbackEmail(id: number, audience: "admin" | "customer") {
  const request = await getCallbackRequest(id);
  if (!request) return null;
  const input = {
    name: request.name,
    email: request.email,
    phone: request.phone,
    preferredDate: request.preferredDate,
    timeSlot: request.timeSlot,
    topics: request.topics,
  };
  const result = audience === "admin"
    ? await sendAdminCallbackEmail(id, input)
    : await sendCustomerCallbackEmail(input);
  const prefix = audience === "admin" ? "admin" : "customer";
  await db.update(assessmentCallbackRequests).set({
    [`${prefix}EmailStatus`]: result.ok ? "sent" : "failed",
    [`${prefix}EmailId`]: result.ok ? result.providerMessageId : null,
    [`${prefix}EmailError`]: result.ok ? null : result.errorCode,
    updatedAt: new Date(),
  }).where(eq(assessmentCallbackRequests.id, id));
  return result;
}
