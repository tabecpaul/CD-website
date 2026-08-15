"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CopyButton from "./CopyButton";
import ContentStatusBadge from "./ContentStatusBadge";

type Props = { task: { id: number; channelLabel: string; scheduledLabel: string; status: "draft" | "ready" | "published" | "performance_checked"; displayStatus: "draft" | "ready" | "due" | "overdue" | "published" | "performance_checked"; postCopy: string; cardSlides: string[] | null; altText: string | null; trackedUrl: string; publishedUrl: string | null; adminNote: string | null; performance: { views: number | null; likes: number | null; comments: number | null; saves: number | null; shares: number | null; linkClicks: number | null } | null } };

export default function ContentTaskEditor({ task }: Props) {
  const router = useRouter();
  const [publishedUrl, setPublishedUrl] = useState(task.publishedUrl ?? "");
  const [adminNote, setAdminNote] = useState(task.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [metrics, setMetrics] = useState({ views: task.performance?.views?.toString() ?? "", likes: task.performance?.likes?.toString() ?? "", comments: task.performance?.comments?.toString() ?? "", saves: task.performance?.saves?.toString() ?? "", shares: task.performance?.shares?.toString() ?? "", linkClicks: task.performance?.linkClicks?.toString() ?? "" });

  async function update(status: "draft" | "ready" | "published") {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/admin/content/${task.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, publishedUrl, adminNote }) });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? "저장했습니다." : result.error === "published_url_invalid" ? "올바른 게시 URL을 입력하세요." : "저장하지 못했습니다.");
    if (response.ok) router.refresh();
  }

  async function savePerformance() {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/admin/content/${task.id}/performance`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...metrics, adminNote }) });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? "성과를 저장했습니다." : result.error === "content_performance_requires_published" ? "게시 URL을 먼저 저장하세요." : "성과를 저장하지 못했습니다.");
    if (response.ok) router.refresh();
  }

  return <details className="rounded-2xl border border-navy/10 bg-white" open={task.displayStatus === "due" || task.displayStatus === "overdue"}>
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5"><div><strong className="text-lg">{task.channelLabel}</strong><p className="mt-1 text-xs text-navy/50">{task.scheduledLabel}</p></div><ContentStatusBadge status={task.displayStatus} /></summary>
    <div className="border-t border-navy/8 p-5">
      <section><div className="flex items-center justify-between gap-3"><h3 className="font-black">게시 문안</h3><CopyButton value={task.postCopy} /></div><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-cream p-4 font-sans text-sm leading-6">{task.postCopy}</pre></section>
      {task.cardSlides?.length ? <section className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="font-black">카드뉴스 {task.cardSlides.length}장</h3><CopyButton value={task.cardSlides.join("\n\n")} label="전체 복사" /></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{task.cardSlides.map((slide, index) => <article key={index} className="rounded-xl border border-navy/10 p-4"><pre className="whitespace-pre-wrap font-sans text-sm leading-6">{slide}</pre></article>)}</div></section> : null}
      {task.altText ? <section className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="font-black">대체 텍스트</h3><CopyButton value={task.altText} /></div><p className="mt-3 rounded-xl bg-cream p-4 text-sm leading-6">{task.altText}</p></section> : null}
      <section className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="font-black">UTM 링크</h3><CopyButton value={task.trackedUrl} /></div><p className="mt-3 break-all rounded-xl bg-cream p-4 text-xs leading-5">{task.trackedUrl}</p></section>
      <section className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-bold">실제 게시 URL<input type="url" value={publishedUrl} onChange={(event) => setPublishedUrl(event.target.value)} placeholder="https://..." className="h-11 rounded-xl border border-navy/15 px-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold">운영 메모<textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} maxLength={2000} rows={3} className="rounded-xl border border-navy/15 p-3 font-normal" /></label><p className="text-xs text-navy/45">고객 개인정보나 상담 관련 민감정보는 기록하지 마세요.</p><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => update("ready")} className="rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-bold">준비 완료</button><button disabled={busy || !publishedUrl} onClick={() => update("published")} className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">게시 URL 저장·발행 완료</button></div></section>
      <section className="mt-7 border-t border-navy/10 pt-6"><h3 className="font-black">초기 성과</h3><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{([['views','조회'],['likes','좋아요'],['comments','댓글'],['saves','저장'],['shares','공유'],['linkClicks','링크 클릭']] as const).map(([key, label]) => <label key={key} className="grid gap-1 text-xs font-bold">{label}<input type="number" min="0" value={metrics[key]} onChange={(event) => setMetrics({ ...metrics, [key]: event.target.value })} className="h-10 rounded-lg border border-navy/15 px-3 text-sm font-normal" /></label>)}</div><button disabled={busy || !publishedUrl} onClick={savePerformance} className="mt-4 rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">성과 확인 완료</button></section>
      {message ? <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-teal/10 p-3 text-sm font-bold">{message}</p> : null}
    </div>
  </details>;
}
