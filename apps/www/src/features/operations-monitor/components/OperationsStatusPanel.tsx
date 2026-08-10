import Link from "next/link";
import { operationsIssueDefinitions, type OperationsSnapshot } from "../domain";

export default function OperationsStatusPanel({ snapshot, latestStatus, latestSuccessAt, stale }: { snapshot: OperationsSnapshot; latestStatus: string | null; latestSuccessAt: Date | null; stale: boolean }) {
  const warning = stale || latestStatus === "failed";
  return <section className={`mt-7 rounded-2xl border p-5 ${warning ? "border-red-200 bg-red-50" : snapshot.issueCount ? "border-amber-200 bg-amber-50" : "border-teal/20 bg-white"}`}>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black tracking-[.12em] text-teal">OPERATIONS MONITOR</p><h2 className="mt-2 text-lg font-black">{warning ? "모니터링 상태를 확인하세요" : snapshot.issueCount ? `운영 확인 필요 ${snapshot.issueCount}건` : "현재 감지된 운영 이상 없음"}</h2><p className="mt-2 text-xs text-navy/50">마지막 성공: {latestSuccessAt ? latestSuccessAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "성공 기록 없음"} · 현재 조회: {new Date(snapshot.checkedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${warning ? "bg-red-200 text-red-800" : snapshot.issueCount ? "bg-amber-200" : "bg-teal/10 text-teal"}`}>{warning ? "CHECK" : snapshot.issueCount ? "ACTION" : "OK"}</span></div>
    {snapshot.issues.length ? <div className="mt-4 flex flex-wrap gap-2">{snapshot.issues.map((issue) => { const definition = operationsIssueDefinitions[issue.key]; return definition.filter ? <Link key={issue.key} href={`/admin/callbacks?operation=${definition.filter}`} className="rounded-full bg-white px-3 py-2 text-xs font-bold shadow-sm">{definition.label} {issue.count}</Link> : <span key={issue.key} className="rounded-full bg-white px-3 py-2 text-xs font-bold shadow-sm">{definition.label} {issue.count}</span>; })}</div> : null}
  </section>;
}
