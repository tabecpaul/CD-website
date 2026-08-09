import { Resend } from "resend";
import {
  callbackTopics,
  optionLabel,
  timeSlots,
} from "../domain";
import type { CallbackSubmission } from "./validation";
import { formatKoreaDateTime } from "./scheduleTime";

export type CallbackEmailInput = Pick<CallbackSubmission,
  "name" | "email" | "phone" | "preferredDate" | "timeSlot" | "topics"
>;

export type CallbackEmailResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; errorCode: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char] ?? char);
}

function config() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() ?? from;
  if (!apiKey || !from || !replyTo) throw new Error("CALLBACK_EMAIL_CONFIG_MISSING");
  const fromHeader = from.includes("<") ? from : `Career Direct Korea <${from}>`;
  return { resend: new Resend(apiKey), from: fromHeader, replyTo };
}

function shell(content: string) {
  return `<div style="margin:0;background:#f7f3ea;padding:32px 16px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#173b49"><div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;padding:32px"><p style="margin:0 0 16px;color:#278a96;font-size:12px;font-weight:700;letter-spacing:.12em">CAREER DIRECT KOREA</p>${content}</div></div>`;
}

async function send(input: { to: string; subject: string; html: string }): Promise<CallbackEmailResult> {
  try {
    const { resend, from, replyTo } = config();
    const result = await resend.emails.send({ from, replyTo, ...input });
    if (!result.data?.id) return { ok: false, errorCode: "RESEND_EMAIL_ID_MISSING" };
    return { ok: true, providerMessageId: result.data.id };
  } catch (error) {
    const code = error instanceof Error && error.message === "CALLBACK_EMAIL_CONFIG_MISSING"
      ? "CALLBACK_EMAIL_CONFIG_MISSING"
      : error instanceof Error ? error.name.slice(0, 80) : "CALLBACK_EMAIL_FAILED";
    return { ok: false, errorCode: code };
  }
}

export function callbackTopicLabels(topics: string[]) {
  return topics.map((topic) => optionLabel(callbackTopics, topic)).join(", ");
}

export async function sendAdminCallbackEmail(id: number, input: CallbackEmailInput) {
  const notificationEmail = process.env.CALLBACK_NOTIFICATION_EMAIL?.trim() ?? "";
  if (!notificationEmail) {
    return { ok: false, errorCode: "CALLBACK_EMAIL_CONFIG_MISSING" } as const;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  return send({
    to: notificationEmail,
    subject: `[신규 콜백] ${input.name}님 · ${input.preferredDate}`,
    html: shell(`<h1 style="font-size:24px;margin:0 0 20px">20분 무료 콜백 신청</h1><p><strong>이름:</strong> ${escapeHtml(input.name)}</p><p><strong>전화:</strong> ${escapeHtml(input.phone)}</p><p><strong>희망:</strong> ${escapeHtml(input.preferredDate)} · ${escapeHtml(optionLabel(timeSlots, input.timeSlot))}</p><p><strong>주제:</strong> ${escapeHtml(callbackTopicLabels(input.topics))}</p><p style="margin-top:28px"><a href="${siteUrl}/admin/callbacks/${id}" style="display:inline-block;background:#173b49;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px">관리자 상세 보기</a></p>`),
  });
}

export async function sendCustomerCallbackEmail(input: CallbackEmailInput) {
  return send({
    to: input.email,
    subject: "20분 무료 콜백 신청이 접수되었습니다",
    html: shell(`<h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(input.name)}님, 신청이 접수되었습니다.</h1><p style="line-height:1.7">영업일 기준 1일 이내에 연락드려 20분 통화 시간을 확정하겠습니다.</p><div style="margin:24px 0;padding:18px;border-radius:12px;background:#eaf5f5;line-height:1.7"><strong>희망 일정</strong><br>${escapeHtml(input.preferredDate)} · ${escapeHtml(optionLabel(timeSlots, input.timeSlot))}</div><p style="line-height:1.7">콜백에서는 Career Direct 검사 적합성, 진행 과정과 비용을 1:1로 안내합니다. 신청만으로 결제되거나 검사가 시작되지 않습니다.</p>`),
  });
}

function maskedPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? `${digits.slice(0, 3)}-****-${digits.slice(-4)}` : "등록된 연락처";
}

export async function sendScheduleConfirmationEmail(input: {
  name: string;
  email: string;
  phone: string;
  start: Date;
  end: Date;
  googleCalendarUrl: string;
  icsUrl: string;
  rescheduleUrl: string;
  reconfirmed: boolean;
}) {
  return send({
    to: input.email,
    subject: input.reconfirmed ? "20분 무료 콜백 일정이 변경 확정되었습니다" : "20분 무료 콜백 일정이 확정되었습니다",
    html: shell(`<h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(input.name)}님, 콜백 일정이 ${input.reconfirmed ? "변경 확정" : "확정"}되었습니다.</h1><div style="margin:24px 0;padding:20px;border-radius:14px;background:#eaf5f5;line-height:1.8"><strong>${escapeHtml(formatKoreaDateTime(input.start))}–${escapeHtml(new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: true }).format(input.end))}</strong><br>20분 전화 콜백 · ${escapeHtml(maskedPhone(input.phone))}</div><p style="line-height:1.7">Career Direct 검사 적합성, 진행 과정과 비용을 안내해 드립니다. 신청만으로 결제되거나 검사가 시작되지 않습니다.</p><p style="margin:24px 0"><a href="${escapeHtml(input.googleCalendarUrl)}" style="display:inline-block;background:#173b49;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;margin:0 8px 8px 0">Google Calendar에 추가</a><a href="${escapeHtml(input.icsUrl)}" style="display:inline-block;border:1px solid #173b49;color:#173b49;text-decoration:none;padding:12px 18px;border-radius:10px">Apple·Outlook 캘린더</a></p><p style="margin-top:26px;font-size:14px;line-height:1.7">시간 변경이 필요하신가요? <a href="${escapeHtml(input.rescheduleUrl)}" style="color:#278a96">일정 변경 요청</a><br>변경 요청 후 새 확정 이메일을 받아야 일정 변경이 완료됩니다.</p>`),
  });
}

export async function sendScheduleReminderEmail(input: {
  name: string;
  email: string;
  phone: string;
  start: Date;
  end: Date;
  googleCalendarUrl: string;
  icsUrl: string;
  rescheduleUrl: string;
}) {
  return send({
    to: input.email,
    subject: "내일은 Career Direct 20분 무료 콜백 일정입니다",
    html: shell(`<h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(input.name)}님, 콜백 일정이 하루 앞으로 다가왔습니다.</h1><div style="margin:24px 0;padding:20px;border-radius:14px;background:#eaf5f5;line-height:1.8"><strong>${escapeHtml(formatKoreaDateTime(input.start))}–${escapeHtml(new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: true }).format(input.end))}</strong><br>20분 전화 콜백 · ${escapeHtml(maskedPhone(input.phone))}</div><p style="margin:24px 0"><a href="${escapeHtml(input.googleCalendarUrl)}" style="display:inline-block;background:#173b49;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;margin:0 8px 8px 0">Google Calendar에 추가</a><a href="${escapeHtml(input.icsUrl)}" style="display:inline-block;border:1px solid #173b49;color:#173b49;text-decoration:none;padding:12px 18px;border-radius:10px">Apple·Outlook 캘린더</a></p><p style="font-size:14px;line-height:1.7">변경이 꼭 필요하다면 <a href="${escapeHtml(input.rescheduleUrl)}" style="color:#278a96">일정 변경을 요청해 주세요.</a> 요청만으로 기존 일정이 변경되지는 않습니다.</p>`),
  });
}

export async function sendAdminRescheduleRequestEmail(id: number, input: {
  name: string;
  preferredDate: string;
  timeSlotLabel: string;
  message: string | null;
}) {
  const notificationEmail = process.env.CALLBACK_NOTIFICATION_EMAIL?.trim() ?? "";
  if (!notificationEmail) return { ok: false, errorCode: "CALLBACK_EMAIL_CONFIG_MISSING" } as const;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  return send({
    to: notificationEmail,
    subject: `[일정 변경 요청] ${input.name}님 · ${input.preferredDate}`,
    html: shell(`<h1 style="font-size:24px;margin:0 0 20px">콜백 일정 변경 요청</h1><p><strong>고객:</strong> ${escapeHtml(input.name)}</p><p><strong>새 희망:</strong> ${escapeHtml(input.preferredDate)} · ${escapeHtml(input.timeSlotLabel)}</p>${input.message ? `<p><strong>메시지:</strong> ${escapeHtml(input.message)}</p>` : ""}<p style="margin-top:28px"><a href="${siteUrl}/admin/callbacks/${id}" style="display:inline-block;background:#173b49;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px">일정 다시 확인하기</a></p>`),
  });
}
