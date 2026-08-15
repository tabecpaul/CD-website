import { contentTaskStatusLabels } from "../domain";

export default function ContentStatusBadge({ status }: { status: keyof typeof contentTaskStatusLabels }) {
  const tone = status === "overdue" ? "bg-red-100 text-red-700" : status === "due" ? "bg-amber-100 text-amber-800" : status === "performance_checked" ? "bg-teal text-white" : status === "published" ? "bg-teal/15 text-teal" : status === "ready" ? "bg-gold/25 text-navy" : "bg-navy/5 text-navy/60";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{contentTaskStatusLabels[status]}</span>;
}

