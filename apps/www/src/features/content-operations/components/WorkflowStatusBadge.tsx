import { contentWorkflowStatusLabels, type ContentWorkflowStatus } from "../domain";

const styles: Record<ContentWorkflowStatus, string> = {
  proposed: "bg-amber-50 text-amber-900",
  revision_requested: "bg-amber-100 text-amber-900",
  approved: "bg-sky-100 text-sky-900",
  production_ready: "bg-teal/12 text-teal",
  site_published: "bg-emerald-100 text-emerald-900",
  completed: "bg-navy text-white",
  hold: "bg-rose-100 text-rose-900",
};

export default function WorkflowStatusBadge({ status }: { status: ContentWorkflowStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles[status]}`}>
    {contentWorkflowStatusLabels[status]}
  </span>;
}
