"use client";

import { useSyncExternalStore } from "react";
import { clearMetaConsent, metaConsentServerSnapshot, readMetaConsent, subscribeMetaConsent, writeMetaConsent, type MetaConsent } from "../consent";
import { revokeMetaConsent } from "../client";

export default function ConsentSettingsButton() {
  const value = useSyncExternalStore(subscribeMetaConsent, readMetaConsent, metaConsentServerSnapshot);

  function update(next: MetaConsent) {
    writeMetaConsent(next);
    if (next === "essential") revokeMetaConsent();
  }

  function reset() {
    revokeMetaConsent();
    clearMetaConsent();
  }

  return (
    <div className="not-prose my-5 rounded-2xl border border-navy/10 bg-white p-5">
      <p className="text-sm font-bold text-navy">현재 선택: {value === "all" ? "모두 허용" : value === "essential" ? "필수 항목만" : "선택 전"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => update("essential")} className="rounded-xl border border-navy/15 px-4 py-2 text-sm font-bold text-navy">필수 항목만</button>
        <button type="button" onClick={() => update("all")} className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white">모두 허용</button>
        <button type="button" onClick={reset} className="rounded-xl px-4 py-2 text-sm font-semibold text-navy/60 underline">다시 선택</button>
      </div>
    </div>
  );
}
