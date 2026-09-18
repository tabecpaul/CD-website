import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import NewProposalForm from "@/features/content-operations/components/NewProposalForm";

export const metadata: Metadata = { title: "콘텐츠 제안 등록 | Career Direct Korea", robots: { index: false, follow: false } };

export default async function NewContentProposalPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14"><div className="mx-auto max-w-3xl">
    <Link href="/admin/content" className="text-sm font-bold text-teal underline">← 콘텐츠 운영 목록</Link>
    <header className="mt-6"><p className="text-xs font-black tracking-[.15em] text-teal">CONTENT PROPOSAL</p><h1 className="mt-2 text-3xl font-black">신규 제안 등록</h1><p className="mt-3 text-sm leading-6 text-navy/55">Drive 패키지를 운영 대시보드의 검토 흐름에 연결합니다. 등록만으로 승인되거나 게시되지 않습니다.</p></header>
    <NewProposalForm />
  </div></main>;
}
