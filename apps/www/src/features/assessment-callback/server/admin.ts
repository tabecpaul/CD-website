import { and, desc, eq, inArray } from "drizzle-orm";
import { assessmentCallbackPayments, assessmentCallbackRequests, callbackPaymentAuditLogs, db } from "@newland/db";
import { auditValues } from "@/features/callback-payment/server/audit";
import { callbackStatuses, normalizeContactMethod, type CallbackStatus } from "../domain";
import { sendAdminCallbackEmail, sendCustomerCallbackEmail } from "./emails";

export const callbackOperationFilters = ["real", "test", "overdue", "email_failed", "evidence_needed", "refund_pending"] as const;
export type CallbackOperationFilter = (typeof callbackOperationFilters)[number];

export async function listCallbackRequests(status?: string, operation?: string) {
  const safeStatus = callbackStatuses.includes(status as CallbackStatus) ? status : undefined;
  const safeOperation = callbackOperationFilters.includes(operation as CallbackOperationFilter) ? operation as CallbackOperationFilter : undefined;
  const callbacks = await db.query.assessmentCallbackRequests.findMany({
    where: safeStatus ? eq(assessmentCallbackRequests.status, safeStatus) : undefined,
    orderBy: [desc(assessmentCallbackRequests.createdAt)],
    limit: 100,
  });
  const payments = callbacks.length ? await db.query.assessmentCallbackPayments.findMany({
    where: and(inArray(assessmentCallbackPayments.callbackRequestId, callbacks.map((item) => item.id)), eq(assessmentCallbackPayments.isActive, true)),
  }) : [];
  const byCallback = new Map(payments.map((payment) => [payment.callbackRequestId, payment]));
  const now = Date.now();
  return callbacks.map((callback) => ({ ...callback, activePayment: byCallback.get(callback.id) ?? null })).filter(({ isTest, activePayment }) => {
    if (!safeOperation) return true;
    if (safeOperation === "real") return !isTest;
    if (safeOperation === "test") return isTest;
    if (!activePayment) return false;
    if (safeOperation === "overdue") return activePayment.paymentStatus === "awaiting_payment" && Boolean(activePayment.paymentDueAt && activePayment.paymentDueAt.getTime() < now);
    if (safeOperation === "email_failed") return [activePayment.instructionEmailStatus, activePayment.confirmationEmailStatus, activePayment.refundRequestEmailStatus, activePayment.refundCompletedEmailStatus].includes("failed");
    if (safeOperation === "evidence_needed") return activePayment.evidenceStatus === "requested";
    return activePayment.paymentStatus === "refund_pending";
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
  if (!reason || reason.length > 500) throw new Error("CALLBACK_UPDATE_INVALID");
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
    contactMethod: normalizeContactMethod(request.contactMethod),
    programCohort: request.programCohort,
    institutionName: request.institutionName,
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
