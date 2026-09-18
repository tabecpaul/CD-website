"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  contentWorkflowStatuses,
  contentWorkflowStatusLabels,
  type ContentWorkflowStatus,
  type DuplicateGateStatus,
  type SiteFirstStatus,
} from "../domain";

type Props = {
  item: {
    id: number;
    status: ContentWorkflowStatus;
    duplicateGate: DuplicateGateStatus;
    siteFirstStatus: SiteFirstStatus;
    canonicalUrl: string | null;
    adminNote: string | null;
  };
};

export default function ContentWorkflowEditor({ item }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [duplicateGate, setDuplicateGate] = useState(item.duplicateGate);
  const [siteFirstStatus, setSiteFirstStatus] = useState(item.siteFirstStatus);
  const [canonicalUrl, setCanonicalUrl] = useState(item.canonicalUrl ?? "");
  const [adminNote, setAdminNote] = useState(item.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/admin/content/proposals/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, duplicateGate, siteFirstStatus, canonicalUrl, adminNote }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    const messages: Record<string, string> = {
      content_workflow_transition_invalid: "현재 상태에서 선택한 상태로 바로 이동할 수 없습니다.",
      content_duplicate_gate_required: "승인 이후 단계에는 Duplicate Gate PASS가 필요합니다.",
      content_site_first_required: "사이트 선게재 이후 단계에는 Site-First PASS와 실제 canonical URL이 필요합니다.",
      content_canonical_url_invalid: "실제 Production canonical URL을 확인하세요.",
    };
    setMessage(response.ok ? "저장했습니다." : messages[result.error] ?? "저장하지 못했습니다.");
    if (response.ok) router.refresh();
  }

  const inputClass = "h-11 rounded-xl border border-navy/15 px-3 font-normal";
  return <section className="mt-8 grid gap-5 rounded-2xl border border-navy/10 bg-white p-6">
    <div className="grid gap-5 sm:grid-cols-3">
      <label className="grid gap-2 text-sm font-bold">운영 상태<select value={status} onChange={(event) => setStatus(event.target.value as ContentWorkflowStatus)} className={inputClass}>{contentWorkflowStatuses.map((value) => <option key={value} value={value}>{contentWorkflowStatusLabels[value]}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-bold">Duplicate Gate<select value={duplicateGate} onChange={(event) => setDuplicateGate(event.target.value as DuplicateGateStatus)} className={inputClass}><option value="unknown">UNKNOWN</option><option value="pass">PASS</option><option value="revise">REVISE</option><option value="blocked">BLOCKED</option></select></label>
      <label className="grid gap-2 text-sm font-bold">Site-First Gate<select value={siteFirstStatus} onChange={(event) => setSiteFirstStatus(event.target.value as SiteFirstStatus)} className={inputClass}><option value="not_applicable">NOT APPLICABLE</option><option value="hold">HOLD</option><option value="pass">PASS</option></select></label>
    </div>
    <label className="grid gap-2 text-sm font-bold">Production canonical URL<input type="url" value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} placeholder="https://www.careerdirect.kr/blog/..." className={inputClass} /></label>
    <label className="grid gap-2 text-sm font-bold">관리자 메모<textarea maxLength={2000} rows={5} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className="rounded-xl border border-navy/15 p-3 font-normal" /></label>
    <div className="rounded-xl bg-cream p-4 text-xs leading-5 text-navy/60">승인은 Duplicate Gate PASS 후에만 가능합니다. `사이트 선게재 완료`와 `발행 완료`는 실제 Production 페이지 확인과 canonical URL 기록 후에만 저장됩니다. 외부 채널 게시와 발행완료는 사용자 확인 없이 자동 처리하지 않습니다.</div>
    <button disabled={busy} onClick={save} className="rounded-xl bg-teal px-5 py-3 font-bold text-white disabled:opacity-40">{busy ? "저장 중…" : "운영 상태 저장"}</button>
    {message ? <p role="status" aria-live="polite" className="rounded-xl bg-teal/10 p-3 text-sm font-bold">{message}</p> : null}
  </section>;
}
