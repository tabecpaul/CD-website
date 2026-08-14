import type { Metadata } from "next";
import Link from "next/link";
import UnsubscribeAction from "@/features/lead-magnet/components/UnsubscribeAction";

export const metadata: Metadata = { title: "이메일 수신 거부 | Career Direct Korea", robots: { index: false, follow: false } };

type UnsubscribePageProps = { searchParams: Promise<{ token?: string | string[] }> };

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[a-f0-9]{48}$/.test(token);
  return (
    <main className="flex min-h-screen items-center bg-cream px-5 py-12">
      <section className="mx-auto w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-[0_24px_80px_rgba(23,50,77,.12)] sm:p-12">
        <p className="text-sm font-black tracking-[.16em] text-teal">EMAIL PREFERENCES</p>
        <h1 className="mt-4 text-3xl font-black text-navy">코칭 이메일 수신 거부</h1>
        <p className="mt-5 leading-7 text-navy/65">수신을 거부하면 아직 발송되지 않은 2·4·6일 차 코칭 이메일을 즉시 중단합니다.</p>
        {valid ? <UnsubscribeAction token={token} /> : <p className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">유효한 수신 거부 링크가 아닙니다.</p>}
        <Link href="/privacy" className="mt-7 inline-block text-sm font-semibold text-teal underline underline-offset-2">개인정보처리방침</Link>
      </section>
    </main>
  );
}
