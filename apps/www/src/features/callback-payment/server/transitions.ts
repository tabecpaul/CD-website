import type { PaymentStatus, ServiceStatus } from "../domain";

const paymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  awaiting_payment: ["paid", "cancelled"],
  paid: ["refund_pending"],
  cancelled: [],
  refund_pending: ["refunded"],
  refunded: [],
};

const serviceTransitions: Record<ServiceStatus, readonly ServiceStatus[]> = {
  not_issued: ["link_issued"],
  link_issued: ["registered"],
  registered: ["assessment_in_progress"],
  assessment_in_progress: ["assessment_completed"],
  assessment_completed: ["consultation_scheduled"],
  consultation_scheduled: ["consultation_scheduled", "consultation_completed"],
  consultation_completed: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus) {
  return from === to || paymentTransitions[from].includes(to);
}

export function canTransitionService(from: ServiceStatus, to: ServiceStatus) {
  return from === to || serviceTransitions[from].includes(to);
}
