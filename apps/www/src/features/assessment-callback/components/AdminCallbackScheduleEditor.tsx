"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: number;
  initialDate: string;
  initialTime: string;
  scheduleStatus: string;
  confirmationEmailStatus: string | null;
  reminderSent: boolean;
  hasChangeRequest: boolean;
};

export default function AdminCallbackScheduleEditor(props: Props) {
  const router = useRouter();
  const [date, setDate] = useState(props.initialDate);
  const [startTime, setStartTime] = useState(props.initialTime);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function confirm(event?: FormEvent, override = false) {
    event?.preventDefault(); setBusy(true); setMessage(null);
    const response = await fetch(`/api/admin/callbacks/${props.id}/schedule`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, startTime, conflictConfirmed: override }) });
    const result = await response.json() as { error?: string; emailSent?: boolean };
    setBusy(false);
    if (response.status === 409) { setConflict(true); setMessage("같은 시간에 다른 콜백이 있습니다. 확인 후에도 이 일정으로 확정할 수 있습니다."); return; }
    setConflict(false);
    if (response.ok) { setMessage(result.emailSent ? "일정을 확정하고 이메일을 보냈습니다." : "일정은 저장했지만 이메일 발송에 실패했습니다. 재발송해 주세요."); router.refresh(); }
    else setMessage(result.error === "schedule_in_past" ? "현재보다 이후의 시간을 입력해 주세요." : "일정을 확정하지 못했습니다.");
  }

  async function resend() {
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/admin/callbacks/${props.id}/schedule/resend`, { method: "POST" });
    setBusy(false); setMessage(response.ok ? "확정 이메일을 다시 보냈습니다." : "확정 이메일을 보내지 못했습니다.");
    if (response.ok) router.refresh();
  }

  async function changeStatus(action: "complete" | "cancel" | "keep_existing") {
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/admin/callbacks/${props.id}/schedule/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(false); setMessage(response.ok ? action === "complete" ? "콜백 완료로 표시했습니다." : action === "cancel" ? "콜백을 취소했습니다." : "기존 일정을 유지했습니다." : "일정 상태를 변경하지 못했습니다.");
    if (response.ok) router.refresh();
  }

  const active = ["confirmed", "reschedule_requested"].includes(props.scheduleStatus);
  return <section className="rounded-2xl border border-navy/10 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">20분 콜백 일정</h2><p className="mt-1 text-xs text-navy/45">한국시간 기준 · 종료 시각은 시작 20분 후 자동 계산</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${props.hasChangeRequest ? "bg-gold/25" : "bg-teal/10"}`}>{props.hasChangeRequest ? "변경 요청 있음" : props.scheduleStatus}</span></div><form onSubmit={confirm} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">날짜<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-12 rounded-xl border border-navy/15 px-4" /></label><label className="grid gap-2 text-sm font-bold">시작 시각<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-12 rounded-xl border border-navy/15 px-4" /></label><button disabled={busy} className="h-11 rounded-xl bg-navy px-5 text-sm font-black text-white disabled:opacity-40 sm:col-span-2">{active ? "새 일정으로 재확정" : "일정 확정 및 이메일 발송"}</button></form>{conflict ? <button disabled={busy} onClick={() => confirm(undefined, true)} className="mt-3 h-11 w-full rounded-xl bg-gold px-5 text-sm font-black text-navy disabled:opacity-40">충돌을 확인했으며 이 일정으로 확정</button> : null}<div className="mt-5 flex flex-wrap gap-2">{active ? <button disabled={busy} onClick={resend} className="rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-bold">확정 이메일 재발송</button> : null}{props.hasChangeRequest ? <button disabled={busy} onClick={() => changeStatus("keep_existing")} className="rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-bold">기존 일정 유지</button> : null}{active ? <button disabled={busy} onClick={() => changeStatus("complete")} className="rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-bold">콜백 완료</button> : null}{active ? <button disabled={busy} onClick={() => changeStatus("cancel")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700">콜백 취소</button> : null}</div><div className="mt-5 grid gap-1 text-xs text-navy/50"><p>확정 이메일: {props.confirmationEmailStatus ?? "미발송"}</p><p>24시간 알림: {props.reminderSent ? "발송 완료" : "대기 또는 대상 아님"}</p></div>{message ? <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-teal/10 p-4 text-sm font-bold">{message}</p> : null}</section>;
}
