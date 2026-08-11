"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatWon, paymentProducts, paymentStatusLabels, serviceStatusLabels, type PaymentProductCode, type PaymentStatus, type ServiceStatus } from "../domain";

type Payment = {
  id: number; version: number; productCode: string; productName: string; supplyAmount: number; vatAmount: number; totalAmount: number;
  paymentStatus: string; paymentDueAt: string | null; instructionEmailStatus: string; confirmationEmailStatus: string | null;
  evidenceType: string; evidenceStatus: string; serviceStatus: string; consultationStartAt: string | null;
  refundFinalAmount: number | null; refundReasonCode: string | null;
};
type RefundPreview = { quote: { amount: number; code: string; explanation: string }; adjustment: number; finalAmount: number };
const CLIENT_LOADED_AT = Date.now();

export default function AdminPaymentEditor({ callbackId, payment, isTest = false }: { callbackId: number; payment: Payment | null; isTest?: boolean }) {
  const router = useRouter();
  const [productCode, setProductCode] = useState<PaymentProductCode>("youth_integrated");
  const [depositorName, setDepositorName] = useState("");
  const [consultationStartAt, setConsultationStartAt] = useState("");
  const [refundReason, setRefundReason] = useState("before_registration");
  const [refundAdjustment, setRefundAdjustment] = useState("0");
  const [missingHalfHours, setMissingHalfHours] = useState("1");
  const [refundNote, setRefundNote] = useState("");
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function request(path: string, method: "POST" | "PATCH", body: Record<string, unknown> = {}) {
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/admin/callbacks/${callbackId}/payment${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({})) as { error?: string; result?: RefundPreview };
    setBusy(false);
    if (response.ok && body.action === "preview" && result.result) {
      setPreview(result.result); setMessage("환불 예상액을 계산했습니다."); return true;
    }
    setMessage(response.ok ? "처리했습니다." : result.error === "invalid_state" ? "현재 단계에서는 처리할 수 없습니다." : result.error === "invalid_request" ? "입력 내용과 확인 절차를 확인해 주세요." : "서버에서 처리하지 못했습니다.");
    if (response.ok) router.refresh();
    return response.ok;
  }

  function refundInput(action: "preview" | "request") {
    return { action, reason: refundReason, adjustmentAmount: Number(refundAdjustment), providerMissingHalfHours: Number(missingHalfHours), note: refundNote };
  }
  function resetPreview() { setPreview(null); }

  if (!payment) return <section className="rounded-2xl border border-navy/10 bg-white p-6">
    <h2 className="text-lg font-black">유료 통합 패키지</h2>
    {isTest ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-black text-red-700">테스트 건입니다. 실제 입금 안내나 환불을 수행하지 마세요.</p> : null}
    <p className="mt-2 text-sm leading-6 text-navy/55">20분 콜백 후 적합한 상품을 선택하면 72시간 유효한 무통장입금 안내를 보냅니다.</p>
    <div className="mt-5 grid gap-3">{Object.values(paymentProducts).map((product) => <label key={product.code} className="flex cursor-pointer gap-3 rounded-xl border border-navy/10 p-4"><input type="radio" checked={productCode === product.code} onChange={() => setProductCode(product.code)} /><span><strong className="block">{product.name} · {formatWon(product.totalAmount)}</strong><span className="text-xs text-navy/50">{product.eligibility} · 공급가 {formatWon(product.supplyAmount)} + VAT {formatWon(product.vatAmount)}</span></span></label>)}</div>
    <label className="mt-4 grid gap-2 text-sm font-bold">입금자명(선택)<input value={depositorName} onChange={(event) => setDepositorName(event.target.value)} maxLength={100} className="h-11 rounded-xl border border-navy/15 px-4" /></label>
    <button disabled={busy} onClick={() => request("", "POST", { productCode, depositorName })} className="mt-5 h-11 rounded-xl bg-navy px-5 text-sm font-black text-white disabled:opacity-40">입금 안내 이메일 보내기</button>
    {message ? <p className="mt-4 rounded-xl bg-teal/10 p-3 text-sm font-bold">{message}</p> : null}
  </section>;

  const activePayment = payment;
  const due = payment.paymentDueAt ? new Date(payment.paymentDueAt) : null;
  const overdue = payment.paymentStatus === "awaiting_payment" && Boolean(due && due.getTime() < CLIENT_LOADED_AT);
  const nextService: Partial<Record<ServiceStatus, ServiceStatus>> = { not_issued: "link_issued", link_issued: "registered", registered: "assessment_in_progress", assessment_in_progress: "assessment_completed", assessment_completed: "consultation_scheduled", consultation_scheduled: "consultation_completed" };
  const next = nextService[payment.serviceStatus as ServiceStatus];

  async function confirmDeposit() {
    if (!window.confirm(`${activePayment.productName} ${formatWon(activePayment.totalAmount)}의 실제 입금을 확인했습니까?`)) return;
    await request("/confirm", "POST", { confirmed: true });
  }
  async function cancelInstruction() {
    const reason = window.prompt("입금 안내 취소 사유를 입력하세요. (1~500자)")?.trim();
    if (!reason) return;
    await request("/cancel", "POST", { reason });
  }
  async function advanceService() {
    if (!next) return;
    if (next === "registered" && !window.confirm("고객이 평가 링크를 클릭해 Career Direct 본부에 직접 등록했습니까? 확인 이후 평가·보고서 금액 165,000원은 환불되지 않습니다.")) return;
    if (next === "consultation_completed" && !window.confirm("고객에게 약정된 3시간 컨설팅을 실제로 모두 제공했습니까?")) return;
    await request("/service", "PATCH", { serviceStatus: next, consultationStartAt: next === "consultation_scheduled" ? new Date(consultationStartAt).toISOString() : undefined, customerRegisteredConfirmed: next === "registered" || undefined, consultationDeliveredConfirmed: next === "consultation_completed" || undefined });
  }

  return <section className="rounded-2xl border border-navy/10 bg-white p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">유료 서비스 관리</h2><p className="mt-1 text-xs text-navy/45">결제 버전 {payment.version}</p></div><span className={`rounded-full px-3 py-2 text-xs font-black ${overdue ? "bg-red-100 text-red-700" : "bg-teal/10"}`}>{overdue ? "입금기한 초과" : paymentStatusLabels[payment.paymentStatus as PaymentStatus] ?? payment.paymentStatus}</span></div>
    {isTest ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-black text-red-700">테스트 데이터입니다. 실제 입금 확인·증빙 발행·환불 이체를 수행하지 마세요.</p> : null}
    <div className="mt-5 rounded-xl bg-cream p-4 text-sm leading-7"><strong>{payment.productName}</strong><br />공급가 {formatWon(payment.supplyAmount)} + VAT {formatWon(payment.vatAmount)} = <strong>{formatWon(payment.totalAmount)}</strong>{due ? <><br />기한 {due.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</> : null}</div>
    {payment.paymentStatus === "awaiting_payment" ? <div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} onClick={() => request("/resend", "POST")} className="rounded-xl border border-navy/15 px-4 py-3 text-sm font-bold">입금 안내 재발송</button><button disabled={busy} onClick={confirmDeposit} className="rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white">입금 확인</button><button disabled={busy} onClick={cancelInstruction} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700">입금 안내 취소</button></div> : null}
    <p className="mt-3 text-xs text-navy/45">안내 이메일: {payment.instructionEmailStatus} · 확인 이메일: {payment.confirmationEmailStatus ?? "미발송"}</p>
    {payment.paymentStatus === "paid" ? <>
      <div className="mt-6 border-t border-navy/10 pt-5"><h3 className="font-black">증빙</h3><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => request("/evidence", "PATCH", { evidenceType: "cash_receipt", evidenceStatus: "issued" })} className="rounded-xl border border-navy/15 px-3 py-2 text-sm font-bold">현금영수증 발행 완료</button><button disabled={busy} onClick={() => request("/evidence", "PATCH", { evidenceType: "tax_invoice", evidenceStatus: "issued" })} className="rounded-xl border border-navy/15 px-3 py-2 text-sm font-bold">세금계산서 발행 완료</button></div><p className="mt-2 text-xs text-navy/45">{payment.evidenceType} · {payment.evidenceStatus}</p></div>
      <div className="mt-6 border-t border-navy/10 pt-5"><h3 className="font-black">평가·3시간 컨설팅</h3><p className="mt-2 text-sm">현재: {serviceStatusLabels[payment.serviceStatus as ServiceStatus] ?? payment.serviceStatus}</p>{next === "registered" ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5">다음 단계는 관리자가 등록하는 기능이 아닙니다. 고객이 본부 시스템에 직접 등록한 사실을 확인하는 단계이며, 이후 평가·보고서 금액 165,000원은 환불되지 않습니다.</p> : null}{next === "consultation_scheduled" ? <input type="datetime-local" value={consultationStartAt} onChange={(event) => setConsultationStartAt(event.target.value)} className="mt-3 h-11 rounded-xl border border-navy/15 px-3" /> : null}{next ? <button disabled={busy || (next === "consultation_scheduled" && !consultationStartAt)} onClick={advanceService} className="mt-3 block rounded-xl bg-teal px-4 py-3 text-sm font-black text-white">{next === "registered" ? "고객 본부 등록 확인" : `다음 단계: ${serviceStatusLabels[next]}`}</button> : null}</div>
      <div className="mt-6 border-t border-navy/10 pt-5"><h3 className="font-black">환불</h3><select value={refundReason} onChange={(event) => { setRefundReason(event.target.value); resetPreview(); }} className="mt-3 h-11 rounded-xl border border-navy/15 px-3 text-sm"><option value="before_registration">본부 등록 전 14일 이내</option><option value="consultation_cancelled">컨설팅 취소</option><option value="no_show">48시간 이내 취소·노쇼</option><option value="provider_unavailable">제공자 사유 미제공</option></select>{refundReason === "provider_unavailable" ? <label className="mt-3 grid gap-1 text-xs font-bold">미제공 30분 단위(1~6)<input type="number" min="1" max="6" value={missingHalfHours} onChange={(event) => { setMissingHalfHours(event.target.value); resetPreview(); }} className="h-10 rounded-xl border border-navy/15 px-3" /></label> : null}<label className="mt-3 grid gap-1 text-xs font-bold">운영자 조정액(차감은 음수)<input type="number" value={refundAdjustment} onChange={(event) => { setRefundAdjustment(event.target.value); resetPreview(); }} className="h-10 rounded-xl border border-navy/15 px-3" /></label><label className="mt-3 grid gap-1 text-xs font-bold">조정·환불 사유 메모<textarea value={refundNote} onChange={(event) => { setRefundNote(event.target.value); resetPreview(); }} maxLength={500} rows={3} className="rounded-xl border border-navy/15 p-3" /></label><p className="mt-2 text-xs text-navy/45">환불계좌·주민번호·카드정보는 메모에 기록하지 마세요.</p><button disabled={busy} onClick={() => request("/refund", "POST", refundInput("preview"))} className="mt-3 rounded-xl border border-navy/20 px-4 py-3 text-sm font-bold">환불 예상액 확인</button>{preview ? <div className="mt-4 rounded-xl bg-cream p-4 text-sm leading-7"><div>정책 기준액 <strong>{formatWon(preview.quote.amount)}</strong></div><div>조정액 <strong>{formatWon(preview.adjustment)}</strong></div><div className="border-t border-navy/10 pt-2">최종 환불액 <strong>{formatWon(preview.finalAmount)}</strong></div><p className="mt-1 text-xs text-navy/55">{preview.quote.explanation}</p><button disabled={busy} onClick={() => request("/refund", "POST", refundInput("request"))} className="mt-3 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700">이 금액으로 환불 접수</button></div> : null}</div>
    </> : null}
    {payment.paymentStatus === "refund_pending" ? <button disabled={busy} onClick={() => window.confirm(`실제로 ${formatWon(payment.refundFinalAmount ?? 0)}을 이체했습니까? 이 작업은 되돌릴 수 없습니다.`) && request("/refund", "POST", { action: "complete", transferCompletedConfirmed: true })} className="mt-5 rounded-xl bg-red-700 px-4 py-3 text-sm font-black text-white">수동 이체 후 환불 완료</button> : null}
    {payment.refundFinalAmount != null ? <p className="mt-3 text-sm font-bold">환불액 {formatWon(payment.refundFinalAmount)}</p> : null}
    {message ? <p role="status" className="mt-4 rounded-xl bg-teal/10 p-3 text-sm font-bold">{message}</p> : null}
  </section>;
}
