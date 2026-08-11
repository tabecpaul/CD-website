export type RefundReason = "before_registration" | "consultation_cancelled" | "no_show" | "provider_unavailable";

type RefundInput = {
  totalAmount: number;
  assessmentAmount: number;
  consultationAmount: number;
  reason: RefundReason;
  registered: boolean;
  assessmentLinkIssuedAt?: Date | null;
  consultationStartAt?: Date | null;
  cancelledAt?: Date;
  providerMissingHalfHours?: number;
};

export type RefundQuote = {
  amount: number;
  code: string;
  explanation: string;
};

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export function calculateRefund(input: RefundInput): RefundQuote {
  const cancelledAt = input.cancelledAt ?? new Date();
  if (input.reason === "before_registration") {
    const linkAge = input.assessmentLinkIssuedAt ? cancelledAt.getTime() - input.assessmentLinkIssuedAt.getTime() : 0;
    if (!input.registered && linkAge >= 0 && linkAge <= FOURTEEN_DAYS) {
      return { amount: input.totalAmount, code: "FULL_BEFORE_REGISTRATION", explanation: "본부 등록 전 14일 이내 전액 환불" };
    }
    return { amount: 0, code: "REGISTRATION_OR_WINDOW_PASSED", explanation: "본부 등록 완료 또는 링크 발송 후 14일 경과" };
  }

  if (input.reason === "provider_unavailable") {
    const units = Math.max(0, Math.min(6, Math.trunc(input.providerMissingHalfHours ?? 0)));
    const unitAmount = input.consultationAmount === 220_000 ? 36_667 : 55_000;
    return { amount: Math.min(input.consultationAmount, unitAmount * units), code: "PROVIDER_MISSING_TIME", explanation: `제공자 사유 미제공 ${units * 30}분` };
  }

  if (!input.registered || !input.consultationStartAt) {
    throw new Error("REFUND_CONTEXT_INVALID");
  }
  const timeUntil = input.consultationStartAt.getTime() - cancelledAt.getTime();
  if (input.reason === "no_show" || timeUntil <= FORTY_EIGHT_HOURS) {
    return { amount: Math.round(input.consultationAmount * 0.9), code: "LATE_CANCELLATION", explanation: "컨설팅 48시간 이내 취소 또는 노쇼" };
  }
  return { amount: input.consultationAmount, code: "EARLY_CANCELLATION", explanation: "컨설팅 48시간 초과 전 취소" };
}
