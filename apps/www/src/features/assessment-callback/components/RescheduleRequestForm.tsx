"use client";

import { useState, type FormEvent } from "react";
import { timeSlots } from "../domain";

export default function RescheduleRequestForm({ token, minDate, maxDate }: { token: string; minDate: string; maxDate: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/callback-schedule/change/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredDate: form.get("preferredDate"), timeSlot: form.get("timeSlot"), message: form.get("message") }),
    });
    setBusy(false);
    if (response.ok) setDone(true);
    else setMessage(response.status === 404 ? "이 링크는 만료되었거나 더 이상 사용할 수 없습니다." : "요청을 저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.");
  }

  if (done) return <div className="rounded-2xl bg-teal/10 p-6"><h2 className="text-xl font-black">변경 요청을 전달했습니다.</h2><p className="mt-3 text-sm leading-7 text-navy/65">아직 일정이 변경된 것은 아닙니다. 관리자가 확인한 뒤 새 확정 이메일을 보내드립니다.</p></div>;

  return <form onSubmit={submit} className="mt-7 space-y-5"><label className="grid gap-2 text-sm font-bold">새 희망 날짜<input required name="preferredDate" type="date" min={minDate} max={maxDate} className="h-12 rounded-xl border border-navy/15 px-4" /></label><label className="grid gap-2 text-sm font-bold">새 희망 시간대<select required name="timeSlot" defaultValue="" className="h-12 rounded-xl border border-navy/15 px-4"><option value="" disabled>시간대를 선택하세요</option>{timeSlots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">메시지 <span className="font-normal text-navy/45">선택</span><textarea name="message" maxLength={500} rows={5} className="rounded-xl border border-navy/15 p-4" placeholder="일정 조율에 필요한 내용만 적어 주세요." /></label><p className="text-sm leading-6 text-navy/55">요청만으로 기존 일정이 변경되지 않습니다. 새 확정 이메일을 받아야 변경이 완료됩니다.</p><button disabled={busy} className="h-12 w-full rounded-xl bg-navy font-black text-white disabled:opacity-40">{busy ? "전달 중…" : "일정 변경 요청하기"}</button>{message ? <p role="alert" className="text-sm font-bold text-red-700">{message}</p> : null}</form>;
}
