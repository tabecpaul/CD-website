"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";

export default function LeadCaptureForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(window.location.search);

    try {
      const response = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          privacyAgreed: form.get("privacyAgreed") === "on",
          coachingAgreed: form.get("coachingAgreed") === "on",
          company: form.get("company"),
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
        }),
      });
      const result = (await response.json()) as { error?: string; token?: string };
      if (!response.ok || !result.token) {
        setError(result.error ?? "신청을 처리하지 못했습니다.");
        return;
      }
      router.push(`/career-check/thank-you?token=${result.token}`);
    } catch {
      setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-[1.75rem] border border-navy/10 bg-white shadow-[0_24px_80px_rgba(23,50,77,0.12)] ${compact ? "p-6 sm:p-8" : "p-6 sm:p-9"}`}
      noValidate
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal">
          <LockKeyhole className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-bold text-navy">이메일로 PDF를 바로 받아보세요</p>
          <p className="mt-1 text-sm leading-6 text-navy/60">이름과 전화번호는 받지 않습니다.</p>
        </div>
      </div>

      <label htmlFor={compact ? "email-final" : "email-hero"} className="text-sm font-semibold text-navy">
        이메일 주소
      </label>
      <input
        id={compact ? "email-final" : "email-hero"}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
        aria-describedby={error ? `${compact ? "final" : "hero"}-error` : undefined}
        className="mt-2 h-14 w-full rounded-xl border border-navy/15 bg-cream/45 px-4 text-base text-navy outline-none transition placeholder:text-navy/35 focus:border-teal focus:ring-4 focus:ring-teal/10"
      />

      <div className="hidden" aria-hidden>
        <label htmlFor={compact ? "company-final" : "company-hero"}>회사명</label>
        <input id={compact ? "company-final" : "company-hero"} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-5 space-y-3">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-navy/75">
          <input name="privacyAgreed" type="checkbox" required className="mt-1 size-4 rounded accent-teal" />
          <span>
            <strong className="font-semibold text-teal">[필수]</strong> PDF 제공을 위한 개인정보 수집·이용에 동의합니다.{" "}
            <Link href="/privacy" className="font-semibold underline underline-offset-2">자세히 보기</Link>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-navy/75">
          <input name="coachingAgreed" type="checkbox" className="mt-1 size-4 rounded accent-teal" />
          <span><strong className="font-semibold text-gold">[선택]</strong> 격일 3회 이메일 미니 코칭을 받겠습니다.</span>
        </label>
      </div>

      {error && (
        <p id={`${compact ? "final" : "hero"}-error`} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 font-bold text-navy shadow-[0_12px_30px_rgba(201,162,78,0.28)] transition hover:-translate-y-0.5 hover:bg-[#d5b35f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <CheckCircle2 className="size-5" aria-hidden />}
        {pending ? "신청을 처리하고 있어요" : "무료 진로방향 자가진단 받기"}
        {!pending && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-navy/50">즉시 다운로드 · 24시간 보안 링크 · 언제든 수신 거부</p>
    </form>
  );
}
