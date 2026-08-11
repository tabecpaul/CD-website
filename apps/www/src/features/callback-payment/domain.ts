export const paymentProducts = {
  youth_integrated: {
    code: "youth_integrated",
    name: "청년 통합 패키지",
    eligibility: "만 15~28세 · 재학 여부 무관",
    supplyAmount: 350_000,
    vatAmount: 35_000,
    totalAmount: 385_000,
    assessmentAmount: 165_000,
    consultationAmount: 220_000,
  },
  adult_integrated: {
    code: "adult_integrated",
    name: "성인 통합 패키지",
    eligibility: "만 29세 이상",
    supplyAmount: 450_000,
    vatAmount: 45_000,
    totalAmount: 495_000,
    assessmentAmount: 165_000,
    consultationAmount: 330_000,
  },
} as const;

export type PaymentProductCode = keyof typeof paymentProducts;
export const paymentProductCodes = Object.keys(paymentProducts) as PaymentProductCode[];

export const paymentStatuses = ["awaiting_payment", "paid", "cancelled", "refund_pending", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  awaiting_payment: "입금 대기",
  paid: "결제 완료",
  cancelled: "취소",
  refund_pending: "환불 처리 중",
  refunded: "환불 완료",
};

export const serviceStatuses = ["not_issued", "link_issued", "registered", "assessment_in_progress", "assessment_completed", "consultation_scheduled", "consultation_completed"] as const;
export type ServiceStatus = (typeof serviceStatuses)[number];
export const serviceStatusLabels: Record<ServiceStatus, string> = {
  not_issued: "평가 링크 미발급",
  link_issued: "평가 링크 발급",
  registered: "본부 등록 완료",
  assessment_in_progress: "평가 진행 중",
  assessment_completed: "평가 완료",
  consultation_scheduled: "3시간 컨설팅 예정",
  consultation_completed: "컨설팅 완료",
};

export function isPaymentProductCode(value: unknown): value is PaymentProductCode {
  return typeof value === "string" && paymentProductCodes.includes(value as PaymentProductCode);
}

export function productSnapshot(code: PaymentProductCode) {
  const product = paymentProducts[code];
  if (product.supplyAmount + product.vatAmount !== product.totalAmount || product.assessmentAmount + product.consultationAmount !== product.totalAmount) {
    throw new Error("PAYMENT_PRODUCT_INVALID");
  }
  return { ...product };
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}
