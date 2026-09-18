import { hasAdminSession } from "@/features/admin/server/auth";
import { isTrustedAdminOrigin } from "@/features/admin/server/origin";
import { parseContentWorkflowCreate } from "@/features/content-operations/server/input";
import { createContentWorkflowItem } from "@/features/content-operations/server/workflow";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTrustedAdminOrigin(request.headers.get("origin"))) return Response.json({ error: "forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 8_000) return Response.json({ error: "request_too_large" }, { status: 413 });
  try {
    const result = await createContentWorkflowItem(parseContentWorkflowCreate(await request.json()));
    return Response.json({ ok: true, created: result.created, item: { id: result.item.id, status: result.item.status } }, { status: result.created ? 201 : 200 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CONTENT_WORKFLOW_CREATE_FAILED";
    const status = code.endsWith("INVALID") ? 400 : 503;
    console.error("Admin content workflow create failed", { errorCode: code.slice(0, 80) });
    return Response.json({ error: status === 503 ? "create_unavailable" : code.toLowerCase() }, { status });
  }
}
