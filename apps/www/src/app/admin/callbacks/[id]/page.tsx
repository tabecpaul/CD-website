import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import { getCallbackRequest } from "@/features/assessment-callback/server/admin";
import { getCallbackPayments } from "@/features/callback-payment/server/admin";
import { ageRangeOptions, callbackDurationMinutes, callbackStatusLabels, callbackTopics, contactMethodOptions, genderOptions, maritalStatusOptions, normalizeContactMethod, optionLabel, scheduleStatusLabels, timeSlots } from "@/features/assessment-callback/domain";
import AdminCallbackEditor from "@/features/assessment-callback/components/AdminCallbackEditor";
import AdminCallbackScheduleEditor from "@/features/assessment-callback/components/AdminCallbackScheduleEditor";
import AdminTestStatusEditor from "@/features/assessment-callback/components/AdminTestStatusEditor";
import { formatKoreaDateInput, formatKoreaDateTime, formatKoreaTimeInput } from "@/features/assessment-callback/server/scheduleTime";
import AdminPaymentEditor from "@/features/callback-payment/components/AdminPaymentEditor";
import PaymentAuditTimeline from "@/features/callback-payment/components/PaymentAuditTimeline";
import { listPaymentAuditLogs } from "@/features/callback-payment/server/audit";

export const metadata: Metadata = { title: "콜백 신청 상세 | Career Direct Korea", robots: { index: false, follow: false } };

export default async function CallbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const request = await getCallbackRequest(Number((await params).id));
  if (!request) notFound();
  const [payments, auditLogs] = await Promise.all([getCallbackPayments(request.id), listPaymentAuditLogs(request.id)]);
  const activePayment = payments.find((payment) => payment.isActive) ?? null;
  const contactMethod = normalizeContactMethod(request.contactMethod);
  const durationMinutes = callbackDurationMinutes(contactMethod);
  const contactMethodLabel = optionLabel(contactMethodOptions, contactMethod);
  const rows = [
    ["이름", request.name], ["휴대전화", request.phone], ["이메일", request.email],
    ["신청 방식", contactMethodLabel],
    ["희망 일정", request.preferredDate && request.timeSlot ? `${request.preferredDate} · ${optionLabel(timeSlots, request.timeSlot)}` : "일정 선택 없음"],
    ["기관/교회", request.institutionName ?? "—"], ["프로그램 기수", request.programCohort ?? "—"],
    ["성별", optionLabel(genderOptions, request.gender)], ["연령대", optionLabel(ageRangeOptions, request.ageRange)],
    ["혼인 여부", optionLabel(maritalStatusOptions, request.maritalStatus)],
    ["상담 주제", request.topics.map((topic) => optionLabel(callbackTopics, topic)).join(", ")],
    ["기타 내용", request.otherTopic ?? "—"], ["마케팅 동의", request.marketingAgreed ? "동의" : "미동의"],
    ["유입", [request.utmSource, request.utmMedium, request.utmCampaign, request.utmContent].filter(Boolean).join(" / ") || "직접 유입"],
  ];
  const scheduleStart = request.confirmedStartAt;
  const hasChangeRequest = request.scheduleStatus === "reschedule_requested";
  const initialDate = hasChangeRequest && request.reschedulePreferredDate ? request.reschedulePreferredDate : scheduleStart ? formatKoreaDateInput(scheduleStart) : request.preferredDate ?? "";
  const initialTime = hasChangeRequest ? "" : scheduleStart ? formatKoreaTimeInput(scheduleStart) : "10:00";
  const paymentProp = activePayment ? { ...activePayment, paymentDueAt: activePayment.paymentDueAt?.toISOString() ?? null, consultationStartAt: activePayment.consultationStartAt?.toISOString() ?? null } : null;

  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14">
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/callbacks" className="text-sm font-bold text-teal underline">← 검사 콜백 목록</Link>
      <header className="mt-6"><p className="text-xs font-black tracking-[.15em] text-teal">CALLBACK #{request.id}</p><h1 className="mt-2 text-3xl font-black">{request.name}님의 콜백 신청</h1><p className="mt-2 text-sm text-navy/50">{callbackStatusLabels[request.status as keyof typeof callbackStatusLabels] ?? request.status} · {request.createdAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p></header>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white"><dl>{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[120px_1fr] border-b border-navy/8 px-5 py-4 last:border-0"><dt className="text-sm font-bold text-navy/50">{label}</dt><dd className="break-words text-sm font-semibold">{value}</dd></div>)}</dl></section>
          <section className="rounded-2xl border border-navy/10 bg-white p-6"><h2 className="font-black">일정 현황</h2>{durationMinutes === null ? <p className="mt-4 text-sm leading-6">상담 없이 평가 신청을 선택했습니다. 일정 확정 없이 결제·평가 안내 단계로 진행합니다.</p> : <><p className="mt-4 text-sm">{scheduleStatusLabels[request.scheduleStatus as keyof typeof scheduleStatusLabels] ?? request.scheduleStatus}</p><p className="mt-2 text-sm">{scheduleStart ? `${formatKoreaDateTime(scheduleStart)} · ${durationMinutes}분` : "정확한 일정이 아직 확정되지 않았습니다."}</p>{request.rescheduleRequestedAt ? <div className="mt-4 rounded-xl bg-gold/15 p-4 text-sm leading-6"><strong>새 희망:</strong> {request.reschedulePreferredDate} · {optionLabel(timeSlots, request.rescheduleTimeSlot ?? "")}<br />{request.rescheduleMessage || "추가 메시지 없음"}</div> : null}</>}</section>
          <section className="rounded-2xl border border-navy/10 bg-white p-6"><h2 className="font-black">이메일 상태</h2><p className="mt-4 text-sm">관리자: {request.adminEmailStatus}{request.adminEmailError ? ` · ${request.adminEmailError}` : ""}</p><p className="mt-2 text-sm">고객: {request.customerEmailStatus}{request.customerEmailError ? ` · ${request.customerEmailError}` : ""}</p></section>
        </div>
        <div className="space-y-6">
          <AdminTestStatusEditor id={request.id} initialIsTest={request.isTest} hasAnonymousId={Boolean(request.anonymousId)} />
          <AdminPaymentEditor callbackId={request.id} payment={paymentProp} isTest={request.isTest} />
          {durationMinutes === null ? <section className="rounded-2xl border border-teal/20 bg-teal/10 p-6"><h2 className="font-black">상담 없이 평가 신청</h2><p className="mt-3 text-sm leading-6 text-navy/65">일정 관리 대상이 아닙니다. 아래 유료 서비스 관리에서 결제 안내와 평가 링크 발급 절차를 진행하세요.</p></section> : <AdminCallbackScheduleEditor id={request.id} initialDate={initialDate} initialTime={initialTime} scheduleStatus={request.scheduleStatus} scheduleStatusLabel={scheduleStatusLabels[request.scheduleStatus as keyof typeof scheduleStatusLabels] ?? request.scheduleStatus} confirmationEmailStatus={request.confirmationEmailStatus} reminderSent={Boolean(request.reminderEmailSentAt)} hasChangeRequest={hasChangeRequest} durationMinutes={durationMinutes} consultationLabel={contactMethodLabel} />}
          <AdminCallbackEditor id={request.id} initialStatus={request.status} initialNote={request.adminNote} />
        </div>
      </div>
      <PaymentAuditTimeline logs={auditLogs} />
    </div>
  </main>;
}
