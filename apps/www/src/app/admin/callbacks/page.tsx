import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import { callbackOperationFilters, listCallbackRequests } from "@/features/assessment-callback/server/admin";
import { callbackStatuses, callbackStatusLabels, callbackTopics, optionLabel, scheduleStatusLabels, timeSlots } from "@/features/assessment-callback/domain";
import { formatKoreaDateTime } from "@/features/assessment-callback/server/scheduleTime";
import { paymentStatusLabels, serviceStatusLabels, type PaymentStatus, type ServiceStatus } from "@/features/callback-payment/domain";

export const metadata: Metadata = { title: "검사 콜백 관리 | Career Direct Korea", robots: { index: false, follow: false } };

const operationLabels = { real: "실제 고객", test: "테스트", overdue: "입금기한 초과", email_failed: "이메일 실패", evidence_needed: "증빙 필요", refund_pending: "환불 대기" } as const;
const SERVER_LOADED_AT = Date.now();

export default async function AdminCallbacksPage({ searchParams }: { searchParams: Promise<{ status?: string; operation?: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const query = await searchParams;
  const requests = await listCallbackRequests(query.status, query.operation);
  const newCount = requests.filter((request) => request.status === "new").length;
  const href = (status?: string, operation?: string) => `/admin/callbacks?${new URLSearchParams({ ...(status ? { status } : {}), ...(operation ? { operation } : {}) })}`;

  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black tracking-[.16em] text-teal">CAREER DIRECT KOREA</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">검사 콜백 관리</h1><p className="mt-2 text-sm text-navy/55">현재 조건 신규 신청 {newCount}건 · 최근 100건</p></div><Link href="/admin/analytics" className="text-sm font-bold text-teal underline">전환 분석 보기</Link></header>
    <p className="mt-7 text-xs font-black tracking-[.12em] text-navy/45">영업 상태</p>
    <nav className="mt-2 flex flex-wrap gap-2"><Link href={href(undefined, query.operation)} className={`rounded-full px-4 py-2 text-sm font-bold ${!query.status ? "bg-navy text-white" : "bg-white"}`}>전체</Link>{callbackStatuses.map((status) => <Link key={status} href={href(status, query.operation)} className={`rounded-full px-4 py-2 text-sm font-bold ${query.status === status ? "bg-navy text-white" : "bg-white"}`}>{callbackStatusLabels[status]}</Link>)}</nav>
    <p className="mt-5 text-xs font-black tracking-[.12em] text-navy/45">운영 필터</p>
    <nav className="mt-2 flex flex-wrap gap-2"><Link href={href(query.status)} className={`rounded-full px-4 py-2 text-sm font-bold ${!query.operation ? "bg-teal text-white" : "bg-white"}`}>전체</Link>{callbackOperationFilters.map((operation) => <Link key={operation} href={href(query.status, operation)} className={`rounded-full px-4 py-2 text-sm font-bold ${query.operation === operation ? "bg-teal text-white" : "bg-white"}`}>{operationLabels[operation]}</Link>)}</nav>
    <section className="mt-8 overflow-x-auto rounded-2xl border border-navy/10 bg-white"><table className="w-full min-w-[1380px] text-left text-sm"><thead className="bg-navy/[.04] text-xs text-navy/55"><tr>{["신청일", "구분", "이름", "연락처", "희망 일정", "확정 일정", "상담 주제", "결제", "서비스", "운영 경고", "상태"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{requests.length ? requests.map((request) => {
      const payment = request.activePayment;
      const overdue = payment?.paymentStatus === "awaiting_payment" && Boolean(payment.paymentDueAt && payment.paymentDueAt.getTime() < SERVER_LOADED_AT);
      const emailFailed = payment && [payment.instructionEmailStatus, payment.confirmationEmailStatus, payment.refundRequestEmailStatus, payment.refundCompletedEmailStatus].includes("failed");
      return <tr key={request.id} className={`border-t border-navy/8 ${request.isTest ? "bg-amber-50" : request.status === "new" ? "bg-teal/[.06]" : ""}`}>
        <td className="px-4 py-4">{request.createdAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</td>
        <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${request.isTest ? "bg-amber-200" : "bg-teal/10 text-teal"}`}>{request.isTest ? "TEST" : "REAL"}</span></td>
        <td className="px-4 py-4 font-black"><Link href={`/admin/callbacks/${request.id}`} className="text-teal underline">{request.name}</Link></td>
        <td className="px-4 py-4"><div>{request.phone}</div><div className="text-xs text-navy/45">{request.email}</div></td>
        <td className="px-4 py-4">{request.preferredDate}<br /><span className="text-xs text-navy/45">{optionLabel(timeSlots, request.timeSlot)}</span></td>
        <td className="px-4 py-4">{request.confirmedStartAt ? formatKoreaDateTime(request.confirmedStartAt) : "미확정"}<br /><span className={`text-xs font-bold ${request.scheduleStatus === "reschedule_requested" ? "text-amber-700" : "text-navy/45"}`}>{scheduleStatusLabels[request.scheduleStatus as keyof typeof scheduleStatusLabels] ?? request.scheduleStatus}</span></td>
        <td className="max-w-64 px-4 py-4">{request.topics.map((topic) => optionLabel(callbackTopics, topic)).join(", ")}</td>
        <td className="px-4 py-4">{payment ? paymentStatusLabels[payment.paymentStatus as PaymentStatus] ?? payment.paymentStatus : "—"}</td>
        <td className="px-4 py-4">{payment ? serviceStatusLabels[payment.serviceStatus as ServiceStatus] ?? payment.serviceStatus : "—"}</td>
        <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{overdue ? <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">기한 초과</span> : null}{emailFailed ? <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">이메일 실패</span> : null}{payment?.evidenceStatus === "requested" ? <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold">증빙 필요</span> : null}{payment?.paymentStatus === "refund_pending" ? <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold">환불 대기</span> : null}</div></td>
        <td className="px-4 py-4"><span className="rounded-full bg-navy/5 px-3 py-1.5 text-xs font-bold">{callbackStatusLabels[request.status as keyof typeof callbackStatusLabels] ?? request.status}</span></td>
      </tr>;
    }) : <tr><td colSpan={11} className="px-5 py-16 text-center text-navy/45">조건에 맞는 콜백 신청이 없습니다.</td></tr>}</tbody></table></section>
  </div></main>;
}
