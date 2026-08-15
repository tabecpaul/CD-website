import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import ContentTaskEditor from "@/features/content-operations/components/ContentTaskEditor";
import { contentChannelLabels } from "@/features/content-operations/domain";
import { getContentOperation } from "@/features/content-operations/server/admin";
import { formatKoreaContentDateTime } from "@/features/content-operations/server/time";
import { parsePositiveId } from "@/features/content-operations/server/input";

export const metadata: Metadata = { title: "콘텐츠 상세 | Career Direct Korea", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  let id: number;
  try { id = parsePositiveId((await params).id); } catch { notFound(); }
  const item = await getContentOperation(id);
  if (!item) notFound();
  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14"><div className="mx-auto max-w-5xl">
    <Link href="/admin/content" className="text-sm font-bold text-teal underline">← 콘텐츠 운영 목록</Link>
    <header className="mt-6"><p className="text-xs font-black tracking-[.15em] text-teal">{item.category} · {item.campaign}</p><h1 className="mt-2 text-3xl font-black leading-tight">{item.title}</h1><div className="mt-3 flex flex-wrap gap-4 text-sm"><a href={item.officialUrl} target="_blank" rel="noreferrer" className="font-bold text-teal underline">공식 원문 열기</a><span className="text-navy/45">CTA: {item.ctaType}</span></div></header>
    <section className="mt-8 grid gap-5">{item.tasks.map((task) => <ContentTaskEditor key={task.id} task={{ id: task.id, channelLabel: contentChannelLabels[task.channel], scheduledLabel: formatKoreaContentDateTime(task.scheduledAt), status: task.status, displayStatus: task.displayStatus, postCopy: task.postCopy, cardSlides: task.cardSlides, altText: task.altText, trackedUrl: task.trackedUrl, publishedUrl: task.publishedUrl, adminNote: task.adminNote, performance: task.latestPerformance ? { views: task.latestPerformance.views, likes: task.latestPerformance.likes, comments: task.latestPerformance.comments, saves: task.latestPerformance.saves, shares: task.latestPerformance.shares, linkClicks: task.latestPerformance.linkClicks } : null }} />)}</section>
  </div></main>;
}

