import { and, desc, eq } from "drizzle-orm";
import { assessmentCallbackPayments, assessmentCallbackRequests, db } from "@newland/db";
import { isPaymentProductCode, productSnapshot, serviceStatuses, type PaymentStatus, type ServiceStatus } from "../domain";
import { canTransitionPayment, canTransitionService } from "./transitions";
import { calculateRefund, type RefundReason } from "./refunds";
import { sendPaymentConfirmedEmail, sendPaymentInstructionEmail, sendRefundEmail } from "./emails";
import { recordAnalyticsEventSafely } from "@/features/analytics/server/events";

const HOURS_72 = 72 * 60 * 60 * 1000;

export async function getCallbackPayments(callbackRequestId: number) {
  return db.query.assessmentCallbackPayments.findMany({ where: eq(assessmentCallbackPayments.callbackRequestId, callbackRequestId), orderBy: [desc(assessmentCallbackPayments.version)] });
}

async function callbackWithPayment(id: number) {
  const callback = await db.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, id) });
  const payment = await db.query.assessmentCallbackPayments.findFirst({ where: and(eq(assessmentCallbackPayments.callbackRequestId, id), eq(assessmentCallbackPayments.isActive, true)) });
  return { callback, payment };
}

export async function createPaymentInstruction(callbackRequestId: number, productCode: unknown, depositorName: unknown) {
  if (!isPaymentProductCode(productCode)) throw new Error("PAYMENT_INPUT_INVALID");
  const safeDepositor = typeof depositorName === "string" ? depositorName.trim() : "";
  if (safeDepositor.length > 100) throw new Error("PAYMENT_INPUT_INVALID");
  const { callback, payment: active } = await callbackWithPayment(callbackRequestId);
  if (!callback) return null;
  if (active) throw new Error("PAYMENT_ACTIVE_EXISTS");
  const previous = await getCallbackPayments(callbackRequestId);
  const product = productSnapshot(productCode);
  const now = new Date();
  const dueAt = new Date(now.getTime() + HOURS_72);
  const [payment] = await db.insert(assessmentCallbackPayments).values({
    callbackRequestId, version: (previous[0]?.version ?? 0) + 1, productCode: product.code, productName: product.name,
    supplyAmount: product.supplyAmount, vatAmount: product.vatAmount, totalAmount: product.totalAmount,
    assessmentAmount: product.assessmentAmount, consultationAmount: product.consultationAmount,
    depositorName: safeDepositor || null, instructionSentAt: now, paymentDueAt: dueAt,
  }).returning();
  const result = await sendPaymentInstructionEmail({ name: callback.name, email: callback.email, productName: product.name, supplyAmount: product.supplyAmount, vatAmount: product.vatAmount, totalAmount: product.totalAmount, dueAt });
  await db.update(assessmentCallbackPayments).set({ instructionEmailStatus: result.ok ? "sent" : "failed", instructionEmailId: result.ok ? result.providerMessageId : null, instructionEmailError: result.ok ? null : result.errorCode, instructionEmailSentAt: result.ok ? new Date() : null, updatedAt: new Date() }).where(eq(assessmentCallbackPayments.id, payment.id));
  await db.update(assessmentCallbackRequests).set({ status: "payment_sent", statusUpdatedAt: new Date(), updatedAt: new Date() }).where(eq(assessmentCallbackRequests.id, callbackRequestId));
  if (result.ok) await recordAnalyticsEventSafely({ eventName: "payment_instruction_sent", productCode: product.code, utm: callback });
  return { payment, email: result };
}

export async function resendPaymentInstruction(callbackRequestId: number) {
  const { callback, payment } = await callbackWithPayment(callbackRequestId);
  if (!callback || !payment) return null;
  if (payment.paymentStatus !== "awaiting_payment" || !payment.paymentDueAt) throw new Error("PAYMENT_STATE_INVALID");
  const result = await sendPaymentInstructionEmail({ name: callback.name, email: callback.email, productName: payment.productName, supplyAmount: payment.supplyAmount, vatAmount: payment.vatAmount, totalAmount: payment.totalAmount, dueAt: payment.paymentDueAt });
  await db.update(assessmentCallbackPayments).set({ instructionEmailStatus: result.ok ? "sent" : "failed", instructionEmailId: result.ok ? result.providerMessageId : payment.instructionEmailId, instructionEmailError: result.ok ? null : result.errorCode, instructionEmailSentAt: result.ok ? new Date() : payment.instructionEmailSentAt, updatedAt: new Date() }).where(eq(assessmentCallbackPayments.id, payment.id));
  return result;
}

export async function confirmPayment(callbackRequestId: number) {
  const { callback, payment } = await callbackWithPayment(callbackRequestId);
  if (!callback || !payment) return null;
  if (payment.paymentStatus === "paid") return { ok: true, already: true };
  if (!canTransitionPayment(payment.paymentStatus as PaymentStatus, "paid")) throw new Error("PAYMENT_STATE_INVALID");
  const now = new Date();
  await db.update(assessmentCallbackPayments).set({ paymentStatus: "paid", paidAt: now, updatedAt: now }).where(and(eq(assessmentCallbackPayments.id, payment.id), eq(assessmentCallbackPayments.paymentStatus, "awaiting_payment")));
  const result = await sendPaymentConfirmedEmail({ name: callback.name, email: callback.email, productName: payment.productName, totalAmount: payment.totalAmount });
  await db.update(assessmentCallbackPayments).set({ confirmationEmailStatus: result.ok ? "sent" : "failed", confirmationEmailId: result.ok ? result.providerMessageId : null, confirmationEmailError: result.ok ? null : result.errorCode, confirmationEmailSentAt: result.ok ? new Date() : null, updatedAt: new Date() }).where(eq(assessmentCallbackPayments.id, payment.id));
  await db.update(assessmentCallbackRequests).set({ status: "paid", statusUpdatedAt: now, updatedAt: now }).where(eq(assessmentCallbackRequests.id, callbackRequestId));
  await recordAnalyticsEventSafely({ eventName: "payment_confirmed", productCode: payment.productCode, utm: callback });
  return result;
}

export async function cancelAwaitingPayment(callbackRequestId: number) {
  const { payment } = await callbackWithPayment(callbackRequestId);
  if (!payment) return null;
  if (payment.paymentStatus === "cancelled") return true;
  if (!canTransitionPayment(payment.paymentStatus as PaymentStatus, "cancelled")) throw new Error("PAYMENT_STATE_INVALID");
  const now = new Date();
  await db.update(assessmentCallbackPayments).set({ paymentStatus: "cancelled", isActive: false, cancelledAt: now, updatedAt: now }).where(and(eq(assessmentCallbackPayments.id, payment.id), eq(assessmentCallbackPayments.paymentStatus, "awaiting_payment")));
  return true;
}

export async function updateEvidence(callbackRequestId: number, input: Record<string, unknown>) {
  const { payment } = await callbackWithPayment(callbackRequestId);
  if (!payment) return null;
  const types = ["none", "cash_receipt", "tax_invoice"];
  const statuses = ["not_requested", "requested", "issued"];
  if (!types.includes(String(input.evidenceType)) || !statuses.includes(String(input.evidenceStatus))) throw new Error("PAYMENT_INPUT_INVALID");
  const issued = input.evidenceStatus === "issued" ? new Date() : null;
  await db.update(assessmentCallbackPayments).set({ evidenceType: String(input.evidenceType), evidenceStatus: String(input.evidenceStatus), evidenceIssuedAt: issued, updatedAt: new Date() }).where(eq(assessmentCallbackPayments.id, payment.id));
  return true;
}

export async function updateService(callbackRequestId: number, input: Record<string, unknown>) {
  const { payment } = await callbackWithPayment(callbackRequestId);
  if (!payment) return null;
  const next = String(input.serviceStatus) as ServiceStatus;
  if (!serviceStatuses.includes(next) || payment.paymentStatus !== "paid" || !canTransitionService(payment.serviceStatus as ServiceStatus, next)) throw new Error("PAYMENT_STATE_INVALID");
  const now = new Date();
  const timestamps: Record<string, Date> = {};
  const key: Partial<Record<ServiceStatus, string>> = { link_issued: "assessmentLinkIssuedAt", registered: "assessmentRegisteredAt", assessment_in_progress: "assessmentStartedAt", assessment_completed: "assessmentCompletedAt", consultation_completed: "consultationCompletedAt" };
  if (key[next]) timestamps[key[next]!] = now;
  if (next === "consultation_scheduled") {
    if (typeof input.consultationStartAt !== "string") throw new Error("PAYMENT_INPUT_INVALID");
    const start = new Date(input.consultationStartAt);
    if (!Number.isFinite(start.getTime()) || start.getTime() <= now.getTime()) throw new Error("PAYMENT_INPUT_INVALID");
    timestamps.consultationStartAt = start;
    timestamps.consultationEndAt = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  }
  await db.update(assessmentCallbackPayments).set({ serviceStatus: next, ...timestamps, consultationChangeCount: next === "consultation_scheduled" && payment.consultationStartAt ? payment.consultationChangeCount + 1 : payment.consultationChangeCount, updatedAt: now }).where(eq(assessmentCallbackPayments.id, payment.id));
  const callbackStatus = next === "consultation_completed" ? "consulting_completed" : next === "not_issued" ? "paid" : "assessment_in_progress";
  await db.update(assessmentCallbackRequests).set({ status: callbackStatus, statusUpdatedAt: now, updatedAt: now }).where(eq(assessmentCallbackRequests.id, callbackRequestId));
  const eventName = next === "link_issued" ? "assessment_link_issued" : next === "registered" ? "assessment_registered" : next === "assessment_completed" ? "assessment_completed" : next === "consultation_completed" ? "consultation_completed" : null;
  if (eventName) {
    const callback = await db.query.assessmentCallbackRequests.findFirst({ where: eq(assessmentCallbackRequests.id, callbackRequestId) });
    await recordAnalyticsEventSafely({ eventName, productCode: payment.productCode, utm: callback ?? undefined });
  }
  return true;
}

export async function processRefund(callbackRequestId: number, input: Record<string, unknown>) {
  const { callback, payment } = await callbackWithPayment(callbackRequestId);
  if (!callback || !payment) return null;
  const action = String(input.action);
  if (action === "request") {
    if (payment.paymentStatus !== "paid") throw new Error("PAYMENT_STATE_INVALID");
    const reason = String(input.reason) as RefundReason;
    if (!["before_registration", "consultation_cancelled", "no_show", "provider_unavailable"].includes(reason)) throw new Error("PAYMENT_INPUT_INVALID");
    const quote = calculateRefund({ totalAmount: payment.totalAmount, assessmentAmount: payment.assessmentAmount, consultationAmount: payment.consultationAmount, reason, registered: Boolean(payment.assessmentRegisteredAt), assessmentLinkIssuedAt: payment.assessmentLinkIssuedAt, consultationStartAt: payment.consultationStartAt, providerMissingHalfHours: Number(input.providerMissingHalfHours ?? 0) });
    const adjustment = Number(input.adjustmentAmount ?? 0);
    const note = typeof input.note === "string" ? input.note.trim() : "";
    const finalAmount = quote.amount + adjustment;
    if (!Number.isSafeInteger(adjustment) || finalAmount < 0 || finalAmount > payment.totalAmount || quote.amount === 0 || note.length > 500 || (adjustment !== 0 && !note)) throw new Error("PAYMENT_INPUT_INVALID");
    await db.update(assessmentCallbackPayments).set({ paymentStatus: "refund_pending", refundReasonCode: reason, refundReasonNote: note || null, refundCalculatedAmount: quote.amount, refundAdjustmentAmount: adjustment, refundFinalAmount: finalAmount, refundRequestedAt: new Date(), updatedAt: new Date() }).where(eq(assessmentCallbackPayments.id, payment.id));
    const email = await sendRefundEmail({ name: callback.name, email: callback.email, amount: finalAmount, completed: false });
    await db.update(assessmentCallbackPayments).set({ refundRequestEmailStatus: email.ok ? "sent" : "failed", refundRequestEmailId: email.ok ? email.providerMessageId : null, refundRequestEmailError: email.ok ? null : email.errorCode, refundRequestEmailSentAt: email.ok ? new Date() : null }).where(eq(assessmentCallbackPayments.id, payment.id));
    return { quote, finalAmount };
  }
  if (action === "complete") {
    if (payment.paymentStatus !== "refund_pending" || payment.refundFinalAmount == null) throw new Error("PAYMENT_STATE_INVALID");
    const now = new Date();
    await db.update(assessmentCallbackPayments).set({ paymentStatus: "refunded", isActive: false, refundCompletedAt: now, updatedAt: now }).where(eq(assessmentCallbackPayments.id, payment.id));
    const email = await sendRefundEmail({ name: callback.name, email: callback.email, amount: payment.refundFinalAmount, completed: true });
    await db.update(assessmentCallbackPayments).set({ refundCompletedEmailStatus: email.ok ? "sent" : "failed", refundCompletedEmailId: email.ok ? email.providerMessageId : null, refundCompletedEmailError: email.ok ? null : email.errorCode, refundCompletedEmailSentAt: email.ok ? new Date() : null }).where(eq(assessmentCallbackPayments.id, payment.id));
    await db.update(assessmentCallbackRequests).set({ status: "on_hold", statusUpdatedAt: now, updatedAt: now }).where(eq(assessmentCallbackRequests.id, callbackRequestId));
    await recordAnalyticsEventSafely({ eventName: "payment_refunded", productCode: payment.productCode, utm: callback });
    return { completed: true };
  }
  throw new Error("PAYMENT_INPUT_INVALID");
}
