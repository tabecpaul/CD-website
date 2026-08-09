import { desc, eq } from "drizzle-orm";
import { callbackPaymentAuditLogs, db } from "@newland/db";

export const paymentAuditActions = ["test_status_changed", "payment_instruction_created", "payment_instruction_resent", "payment_cancelled", "payment_confirmed", "evidence_updated", "service_status_changed", "refund_requested", "refund_completed", "email_failed"] as const;
export type PaymentAuditAction = (typeof paymentAuditActions)[number];
export type AuditInput = { callbackRequestId: number; paymentId?: number | null; action: PaymentAuditAction; previousStatus?: string | null; nextStatus?: string | null; amount?: number | null; reason?: string | null };

export function auditValues(input: AuditInput) {
  return { callbackRequestId: input.callbackRequestId, paymentId: input.paymentId ?? null, action: input.action, previousStatus: input.previousStatus ?? null, nextStatus: input.nextStatus ?? null, amount: input.amount ?? null, reason: input.reason?.trim().slice(0, 500) || null };
}

export async function listPaymentAuditLogs(callbackRequestId: number) {
  return db.query.callbackPaymentAuditLogs.findMany({ where: eq(callbackPaymentAuditLogs.callbackRequestId, callbackRequestId), orderBy: [desc(callbackPaymentAuditLogs.createdAt)], limit: 100 });
}
