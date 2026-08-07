"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

export default function UnsubscribeAction({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  async function unsubscribe() {
    setState("pending");
    const response = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`, { method: "POST" });
    setState(response.ok ? "done" : "error");
  }
  if (state === "done") return <p className="mt-8 flex items-center gap-2 rounded-xl bg-teal/10 p-4 font-semibold text-teal"><CheckCircle2 className="size-5" /> 수신 거부가 완료되었습니다.</p>;
  return (
    <div className="mt-8">
      <button onClick={unsubscribe} disabled={state === "pending"} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 font-bold text-white disabled:opacity-60">
        {state === "pending" && <LoaderCircle className="size-4 animate-spin" />}
        코칭 이메일 수신 거부
      </button>
      {state === "error" && <p role="alert" className="mt-3 text-sm text-red-700">처리하지 못했습니다. 링크를 확인하거나 개인정보 담당자에게 문의해 주세요.</p>}
    </div>
  );
}
