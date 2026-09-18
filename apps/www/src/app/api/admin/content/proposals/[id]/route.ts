import { hasAdminSession } from "@/features/admin/server/auth";
import { isTrustedAdminOrigin } from "@/features/admin/server/origin";
import { parseContentWorkflowUpdate, parsePositiveId } from "@/features/content-operations/server/input";
import { updateContentWorkflowItem } from "@/features/content-operations/server/workflow";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTrustedAdminOrigin(request.headers.get("origin"))) return Response.json({ error: "forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 8_000) return Response.json({ error: "request_too_large" }, { status: 413 });
  try {
    const id = parsePositiveId((await params).id);
    const updated = await updateContentWorkflowItem(id, parseContentWorkflowUpdate(await request.json()));
    return Response.json({ ok: true, item: { id: updated.id, status: updated.status } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CONTENT_WORKFLOW_UPDATE_FAILED";
    const status = code === "CONTENT_WORKFLOW_NOT_FOUND" ? 404 : code.endsWith("INVALID") || code.endsWith("REQUIRED") ? 400 : 503;
    console.error("Admin content workflow update failed", { errorCode: code.slice(0, 80) });
    return Response.json({ error: status === 503 ? "update_unavailable" : code.toLowerCase() }, { status });
  }
}
