import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, MailCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "자가진단 신청 완료 | Career Direct Korea",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({ searchParams }: PageProps<"/career-check/thank-you">) {
  const { token } = await searchParams;
  const validToken = typeof token === "string" && /^[a-f0-9]{48}$/.test(token);

  return (
    <main className="flex min-h-screen items-center bg-cream px-5 py-12 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_100px_rgba(23,50,77,.13)] lg:grid-cols-[.8fr_1.2fr]">
        <div className="relative hidden min-h-[42rem] bg-navy p-10 lg:block">
          <Image src="/images/career-check/page-01.png" alt="진로 방향 자가진단 PDF 표지" width={992} height={1403} className="absolute bottom-[-7rem] left-1/2 w-[72%] -translate-x-1/2 -rotate-2 rounded-lg shadow-2xl" />
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
          <span className="flex size-14 items-center justify-center rounded-full bg-teal/15 text-teal"><MailCheck className="size-7" /></span>
          <p className="mt-7 text-sm font-black tracking-[.16em] text-teal">APPLICATION COMPLETE</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-5xl">이제 첫 번째 질문을<br />시작해 보세요.</h1>
          <p className="mt-6 leading-8 text-navy/65">아래 링크는 24시간 동안 사용할 수 있습니다. 선택 동의하셨다면 2일·4일·6일 차에 한 번씩 이메일 미니 코칭도 보내드립니다.</p>
          {validToken ? (
            <a href={`/api/career-check/download?token=${token}`} className="mt-8 flex h-14 items-center justify-center gap-2 rounded-xl bg-gold px-6 font-bold text-navy shadow-lg transition hover:-translate-y-0.5"><Download className="size-5" /> PDF 다운로드</a>
          ) : (
            <div className="mt-8 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">다운로드 정보가 없습니다. 랜딩페이지에서 이메일을 다시 등록해 주세요.</div>
          )}
          <Link href="/career-check" className="mt-5 inline-flex items-center justify-center gap-2 text-sm font-bold text-teal">랜딩페이지로 돌아가기 <ArrowRight className="size-4" /></Link>
          <p className="mt-10 border-t border-navy/10 pt-6 text-xs leading-5 text-navy/45">PDF는 의료·심리 치료나 표준화된 진로평가를 대체하지 않는 자기성찰 도구입니다.</p>
        </div>
      </div>
    </main>
  );
}
