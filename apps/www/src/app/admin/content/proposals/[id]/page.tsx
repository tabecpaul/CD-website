import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import ContentWorkflowEditor from "@/features/content-operations/components/ContentWorkflowEditor";
import WorkflowStatusBadge from "@/features/content-operations/components/WorkflowStatusBadge";
import { type ContentWorkflowStatus, type DuplicateGateStatus, type SiteFirstStatus } from "@/features/content-operations/domain";
import { parsePositiveId } from "@/features/content-operations/server/input";
import { getContentWorkflowItem } from "@/features/content-operations/server/workflow";

export const metadata: Metadata = { title: "콘텐츠 제안 검토 | Career Direct Korea", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ContentProposalPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  let id: number;
  try { id = parsePositiveId((await params).id); } catch { notFound(); }
  const item = await getContentWorkflowItem(id);
  if (!item) notFound();
  return <main className="min-h-screen bg-cream px-5 py-10 text-navy sm:px-8 sm:py-14"><div className="mx-auto max-w-4xl">
    <Link href="/admin/content" className="text-sm font-bold text-teal underline">← 콘텐츠 운영 목록</Link>
    <header className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-black tracking-[.15em] text-teal">{item.contentAxis}</p><WorkflowStatusBadge status={item.status as ContentWorkflowStatus} /></div>
      <h1 className="mt-3 text-3xl font-black leading-tight">{item.title}</h1>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-bold text-navy/45">제안 발행일</dt><dd className="mt-1 font-bold">{item.proposedPublishDate}</dd></div><div><dt className="font-bold text-navy/45">제안 단일 CTA</dt><dd className="mt-1 font-bold">{item.proposedCta}</dd></div></dl>
      <a href={item.driveFolderUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex font-bold text-teal underline">Drive 패키지 열기</a>
    </header>
    <ContentWorkflowEditor item={{ id: item.id, status: item.status as ContentWorkflowStatus, duplicateGate: item.duplicateGate as DuplicateGateStatus, siteFirstStatus: item.siteFirstStatus as SiteFirstStatus, canonicalUrl: item.canonicalUrl, adminNote: item.adminNote }} />
  </div></main>;
}
