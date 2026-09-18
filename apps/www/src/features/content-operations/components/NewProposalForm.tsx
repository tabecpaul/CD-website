"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProposalForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", contentAxis: "", proposedPublishDate: "", proposedCta: "", driveFolderUrl: "", adminNote: "" });

  function field(name: keyof typeof form) {
    return { value: form[name], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: event.target.value }) };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/admin/content/proposals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) {
      router.push(`/admin/content/proposals/${result.item.id}`);
      router.refresh();
      return;
    }
    setMessage(result.error === "content_workflow_drive_url_invalid" ? "Drive 패키지 폴더 URL을 확인하세요." : "제안을 등록하지 못했습니다.");
  }

  const inputClass = "h-11 rounded-xl border border-navy/15 px-3 font-normal";
  return <form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border border-navy/10 bg-white p-6">
    <label className="grid gap-2 text-sm font-bold">제안 제목<input required maxLength={240} {...field("title")} className={inputClass} /></label>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-bold">콘텐츠 축<input required maxLength={120} {...field("contentAxis")} className={inputClass} /></label>
      <label className="grid gap-2 text-sm font-bold">제안 발행일<input required type="date" {...field("proposedPublishDate")} className={inputClass} /></label>
    </div>
    <label className="grid gap-2 text-sm font-bold">제안 단일 CTA<input required maxLength={160} {...field("proposedCta")} className={inputClass} /></label>
    <label className="grid gap-2 text-sm font-bold">Drive 패키지 폴더 URL<input required type="url" {...field("driveFolderUrl")} placeholder="https://drive.google.com/drive/folders/..." className={inputClass} /></label>
    <label className="grid gap-2 text-sm font-bold">등록 메모<textarea maxLength={2000} rows={4} {...field("adminNote")} className="rounded-xl border border-navy/15 p-3 font-normal" /></label>
    <p className="text-xs leading-5 text-navy/50">등록 시 상태는 `제안`입니다. Duplicate Gate가 PASS이고 관리자가 승인하기 전에는 원고·UTM·카드뉴스 제작을 확정하지 않습니다.</p>
    <button disabled={busy} className="rounded-xl bg-navy px-5 py-3 font-bold text-white disabled:opacity-40">{busy ? "등록 중…" : "제안 등록"}</button>
    {message ? <p role="status" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-900">{message}</p> : null}
  </form>;
}
