import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import { contentChannelLabels, type ContentChannel } from "@/features/content-operations/domain";
import ContentStatusBadge from "@/features/content-operations/components/ContentStatusBadge";
import { listContentOperations } from "@/features/content-operations/server/admin";
import { formatKoreaContentDateTime } from "@/features/content-operations/server/time";

export const metadata: Metadata = { title: "콘텐츠 운영 | Career Direct Korea", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const data = await listContentOperations();
  const summary = [["오늘 발행", data.summary.today], ["이번 주 예정", data.summary.thisWeek], ["확인 지연", data.summary.overdue], ["발행 완료", data.summary.published]] as const;
  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black tracking-[.16em] text-teal">CONTENT OPERATIONS</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">콘텐츠 운영</h1><p className="mt-2 text-sm text-navy/55">9편 · 채널별 문안과 발행 상태를 한곳에서 관리합니다.</p></div><nav className="flex flex-wrap gap-4 text-sm font-bold text-teal underline"><Link href="/admin/callbacks">검사 콜백</Link><Link href="/admin/analytics">전환 분석</Link></nav></header>
    <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{summary.map(([label, value]) => <article key={label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-sm font-bold text-navy/50">{label}</p><strong className="mt-2 block text-3xl font-black">{value}</strong></article>)}</section>
    <section className="mt-8 grid gap-4">{data.items.map((item) => <article key={item.id} className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><p className="text-xs font-black tracking-[.12em] text-teal">{item.category} · {item.campaign}</p><h2 className="mt-2 text-xl font-black leading-tight"><Link href={`/admin/content/${item.id}`} className="hover:text-teal">{item.title}</Link></h2><p className="mt-2 text-xs text-navy/50">첫 발행 {formatKoreaContentDateTime(item.scheduledAt)}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{item.tasks.map((task) => <div key={task.id} className="min-w-32 rounded-xl bg-cream p-3"><p className="text-xs font-bold text-navy/55">{contentChannelLabels[task.channel as ContentChannel]}</p><p className="mt-1 text-[11px] text-navy/45">{formatKoreaContentDateTime(task.scheduledAt)}</p><div className="mt-2"><ContentStatusBadge status={task.displayStatus} /></div></div>)}</div></div></article>)}</section>
  </div></main>;
}

