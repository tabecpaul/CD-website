export const callbackStatuses = [
  "new",
  "scheduled",
  "callback_completed",
  "payment_sent",
  "paid",
  "assessment_in_progress",
  "consulting_completed",
  "on_hold",
] as const;

export type CallbackStatus = (typeof callbackStatuses)[number];

export const scheduleStatuses = [
  "unconfirmed",
  "confirmed",
  "reschedule_requested",
  "completed",
  "cancelled",
] as const;

export type ScheduleStatus = (typeof scheduleStatuses)[number];

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  unconfirmed: "일정 미확정",
  confirmed: "일정 확정",
  reschedule_requested: "일정 변경 요청",
  completed: "콜백 완료",
  cancelled: "콜백 취소",
};

export const CALLBACK_DURATION_MINUTES = 20;
export const CALLBACK_TIME_ZONE = "Asia/Seoul";

export const callbackStatusLabels: Record<CallbackStatus, string> = {
  new: "신규 신청",
  scheduled: "콜백 일정 확정",
  callback_completed: "콜백 완료",
  payment_sent: "결제 안내 발송",
  paid: "결제 완료",
  assessment_in_progress: "평가 진행",
  consulting_completed: "컨설팅 완료",
  on_hold: "보류/종료",
};

export const timeSlots = [
  { value: "morning", label: "오전 9시–12시" },
  { value: "afternoon", label: "오후 12시–6시" },
  { value: "evening", label: "저녁 6시–9시" },
] as const;

export const genderOptions = [
  { value: "prefer_not_to_say", label: "응답하지 않음" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
] as const;

export const ageRangeOptions = [
  { value: "prefer_not_to_say", label: "응답하지 않음" },
  { value: "20_24", label: "20–24세" },
  { value: "25_29", label: "25–29세" },
  { value: "30_34", label: "30–34세" },
  { value: "35_39", label: "35–39세" },
  { value: "40_49", label: "40–49세" },
  { value: "50_plus", label: "50세 이상" },
] as const;

export const maritalStatusOptions = [
  { value: "prefer_not_to_say", label: "응답하지 않음" },
  { value: "single", label: "미혼" },
  { value: "married", label: "기혼" },
] as const;

export const callbackTopics = [
  { value: "career_anxiety", label: "진로 불안" },
  { value: "job_change", label: "이직 고민" },
  { value: "career_change", label: "진로 변경" },
  { value: "return_to_work", label: "경력단절 후 재취업" },
  { value: "other", label: "기타" },
] as const;

export const CALLBACK_CONSENT_VERSION = "2026-08-09-v1";

export function optionLabel<T extends readonly { value: string; label: string }[]>(options: T, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}
