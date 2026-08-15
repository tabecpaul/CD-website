import { hasAdminSession } from "@/features/admin/server/auth";
import { isTrustedAdminOrigin } from "@/features/admin/server/origin";
import { saveContentPerformance } from "@/features/content-operations/server/admin";
import { parseContentPerformance, parsePositiveId } from "@/features/content-operations/server/input";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTrustedAdminOrigin(request.headers.get("origin"))) return Response.json({ error: "forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 5_000) return Response.json({ error: "request_too_large" }, { status: 413 });
  try {
    const id = parsePositiveId((await params).id);
    const saved = await saveContentPerformance(id, parseContentPerformance(await request.json()));
    return Response.json({ ok: true, snapshotId: saved.id });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CONTENT_PERFORMANCE_FAILED";
    const status = code === "CONTENT_TASK_NOT_FOUND" ? 404 : code === "CONTENT_PERFORMANCE_REQUIRES_PUBLISHED" ? 409 : code.endsWith("INVALID") ? 400 : 503;
    console.error("Admin content performance failed", { errorCode: code.slice(0, 80) });
    return Response.json({ error: status === 503 ? "update_unavailable" : code.toLowerCase() }, { status });
  }
}
