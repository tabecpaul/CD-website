"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { metaConsentServerSnapshot, readMetaConsent, subscribeMetaConsent, writeMetaConsent, type MetaConsent } from "../consent";

export default function ConsentBanner() {
  const consent = useSyncExternalStore(subscribeMetaConsent, readMetaConsent, metaConsentServerSnapshot);

  function choose(value: MetaConsent) {
    writeMetaConsent(value);
  }

  if (consent !== null) return null;

  return (
    <aside
      aria-label="선택적 분석 도구 안내"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-navy/10 bg-white p-4 shadow-[0_18px_60px_rgba(23,50,77,0.2)] sm:flex sm:items-center sm:gap-5 sm:p-5"
    >
      <p className="text-xs leading-5 text-navy/70 sm:flex-1 sm:text-sm sm:leading-6">
        더 나은 이용 경험과 광고 성과 측정을 위해 선택적 분석 도구를 사용합니다. 허용하지 않아도 모든 서비스를 이용할 수 있습니다.{" "}
        <Link href="/privacy#optional-analytics" className="whitespace-nowrap font-bold text-teal underline underline-offset-2">자세히 보기</Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:shrink-0">
        <button type="button" onClick={() => choose("essential")} className="h-10 rounded-xl border border-navy/15 px-3 text-xs font-bold text-navy sm:px-4 sm:text-sm">필수 항목만</button>
        <button type="button" onClick={() => choose("all")} className="h-10 rounded-xl bg-navy px-3 text-xs font-bold text-white sm:px-4 sm:text-sm">모두 허용</button>
      </div>
    </aside>
  );
}
