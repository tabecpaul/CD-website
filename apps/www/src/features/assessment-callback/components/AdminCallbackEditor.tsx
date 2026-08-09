"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { callbackStatuses, callbackStatusLabels } from "../domain";

export default function AdminCallbackEditor({ id, initialStatus, initialNote }: { id: number; initialStatus: string; initialNote: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(null);
    const response = await fetch(`/api/admin/callbacks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, adminNote: note }) });
    setBusy(false); setMessage(response.ok ? "저장했습니다." : "저장하지 못했습니다.");
    if (response.ok) router.refresh();
  }

  async function resend(audience: "admin" | "customer") {
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/admin/callbacks/${id}/resend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audience }) });
    setBusy(false); setMessage(response.ok ? "이메일을 다시 보냈습니다." : "이메일 재발송에 실패했습니다.");
    if (response.ok) router.refresh();
  }

  return <div className="space-y-6"><form onSubmit={save} className="rounded-2xl border border-navy/10 bg-white p-6"><h2 className="text-lg font-black">운영 상태</h2><label className="mt-5 grid gap-2 text-sm font-bold">상태<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 rounded-xl border border-navy/15 px-4">{callbackStatuses.map((value) => <option key={value} value={value}>{callbackStatusLabels[value]}</option>)}</select></label><label className="mt-5 grid gap-2 text-sm font-bold">운영 메모<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={7} className="rounded-xl border border-navy/15 p-4 text-sm" /></label><p className="mt-2 text-xs leading-5 text-navy/45">건강·종교·가족관계 등 콜백 운영에 불필요한 민감정보는 기록하지 마세요.</p><button disabled={busy} className="mt-5 h-11 rounded-xl bg-navy px-5 text-sm font-black text-white disabled:opacity-40">상태와 메모 저장</button></form><div className="rounded-2xl border border-navy/10 bg-white p-6"><h2 className="text-lg font-black">이메일 재발송</h2><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} onClick={() => resend("admin")} className="rounded-xl border border-navy/15 px-4 py-3 text-sm font-bold">관리자 알림 재발송</button><button disabled={busy} onClick={() => resend("customer")} className="rounded-xl border border-navy/15 px-4 py-3 text-sm font-bold">고객 확인 재발송</button></div></div>{message ? <p role="status" className="rounded-xl bg-teal/10 p-4 text-sm font-bold text-navy">{message}</p> : null}</div>;
}
