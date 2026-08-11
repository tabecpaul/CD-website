"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminTestStatusEditor({ id, initialIsTest, hasAnonymousId }: { id: number; initialIsTest: boolean; hasAnonymousId: boolean }) {
  const router = useRouter();
  const [isTest, setIsTest] = useState(initialIsTest);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    const next = !isTest;
    const warning = next ? hasAnonymousId ? "같은 브라우저에서 발생한 방문·PDF·CTA·결제 데이터를 모두 분석에서 제외합니다. 계속할까요?" : "콜백·결제 이후 데이터만 분석에서 제외합니다. 이전 익명 방문은 연결 정보가 없어 유지됩니다. 계속할까요?" : "이 신청을 실제 고객 데이터로 되돌립니다. 계속할까요?";
    if (!window.confirm(warning)) return;
    const reason = window.prompt(next ? "테스트로 분류하는 사유를 입력하세요." : "실제 고객으로 복원하는 사유를 입력하세요.")?.trim();
    if (!reason) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/callbacks/${id}/test-status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isTest: next, reason }) });
      if (!response.ok) throw new Error("save_failed");
      setIsTest(next); setMessage(next ? "테스트 데이터로 표시했습니다." : "실제 고객 데이터로 복원했습니다."); router.refresh();
    } catch { setMessage("저장하지 못했습니다."); } finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-navy/10 bg-white p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-black">데이터 구분</h2><p className="mt-2 text-sm text-navy/55">{isTest ? "테스트 신청 · 전환 분석에서 제외" : "실제 고객 신청 · 전환 분석에 포함"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${isTest ? "bg-gold/20 text-navy" : "bg-teal/10 text-teal"}`}>{isTest ? "TEST" : "REAL"}</span></div><button type="button" disabled={busy} onClick={save} className="mt-5 rounded-xl border border-navy/20 px-4 py-3 text-sm font-black disabled:opacity-50">{busy ? "저장 중…" : isTest ? "실제 신청으로 복원" : "테스트 신청으로 표시"}</button>{message ? <p className="mt-3 text-sm font-semibold text-teal">{message}</p> : null}</section>;
}
