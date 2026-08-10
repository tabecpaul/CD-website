import { formatWon } from "../domain";

type AuditLog = {
  id: number;
  action: string;
  previousStatus: string | null;
  nextStatus: string | null;
  amount: number | null;
  reason: string | null;
  createdAt: Date;
};

const labels: Record<string, string> = {
  test_status_changed: "데이터 구분 변경",
  payment_instruction_created: "입금 안내 생성",
  payment_instruction_resent: "입금 안내 재발송",
  payment_instruction_cancelled: "입금 안내 취소",
  payment_confirmed: "입금 확인",
  evidence_changed: "증빙 상태 변경",
  assessment_link_issued: "평가 링크 발급 확인",
  assessment_registered: "고객 본부 등록 확인",
  assessment_started: "평가 시작",
  assessment_completed: "평가 완료",
  consultation_scheduled: "컨설팅 일정 확정",
  consultation_rescheduled: "컨설팅 일정 변경",
  consultation_completed: "컨설팅 완료",
  refund_requested: "환불 접수",
  refund_completed: "환불 완료",
  email_failed: "이메일 실패",
};

export default function PaymentAuditTimeline({ logs }: { logs: AuditLog[] }) {
  return <section className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
    <h2 className="text-lg font-black">운영 변경 이력</h2>
    <p className="mt-2 text-sm text-navy/50">수정하거나 삭제할 수 없는 최근 100건의 기록입니다.</p>
    {logs.length ? <ol className="mt-5 space-y-4">{logs.map((log) => <li key={log.id} className={`rounded-xl border p-4 ${log.action === "email_failed" ? "border-red-200 bg-red-50" : "border-navy/10"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>{labels[log.action] ?? log.action}</strong><time className="text-xs text-navy/45">{log.createdAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</time></div>
      {log.previousStatus || log.nextStatus ? <p className="mt-2 text-sm text-navy/65">{log.previousStatus ?? "—"} → {log.nextStatus ?? "—"}</p> : null}
      {log.amount != null ? <p className="mt-1 text-sm font-bold">{formatWon(log.amount)}</p> : null}
      {log.reason ? <p className="mt-2 break-words text-sm leading-6 text-navy/60">{log.reason}</p> : null}
    </li>)}</ol> : <p className="mt-5 rounded-xl bg-cream p-4 text-sm text-navy/50">아직 기록된 운영 변경이 없습니다.</p>}
  </section>;
}
