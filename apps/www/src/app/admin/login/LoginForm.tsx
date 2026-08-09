"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    setPending(false);
    if (!response.ok) {
      setError(response.status === 429 ? "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." : "비밀번호가 올바르지 않습니다.");
      return;
    }
    router.replace("/admin/analytics");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="admin-password" className="text-sm font-semibold text-navy">관리자 비밀번호</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required className="mt-2 h-12 w-full rounded-xl border border-navy/15 bg-cream px-4 outline-none focus:border-teal focus:ring-4 focus:ring-teal/10" />
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button disabled={pending} className="h-12 w-full rounded-xl bg-navy font-bold text-white disabled:opacity-60">{pending ? "확인 중..." : "대시보드 열기"}</button>
    </form>
  );
}
