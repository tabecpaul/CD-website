import { hasAdminSession } from "@/features/admin/server/auth";
import { isTrustedAdminOrigin } from "@/features/admin/server/origin";
import { updateCallbackRequest } from "@/features/assessment-callback/server/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTrustedAdminOrigin(request.headers.get("origin"))) return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    const id = Number((await params).id);
    const updated = await updateCallbackRequest(id, await request.json());
    if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    const invalidRequest = error instanceof Error && error.message === "CALLBACK_UPDATE_INVALID";
    console.error("Admin callback update failed", {
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
      errorMessage: error instanceof Error ? error.message.slice(0, 180) : "unknown",
    });
    return Response.json(
      { error: invalidRequest ? "invalid_request" : "update_unavailable" },
      { status: invalidRequest ? 400 : 503 },
    );
  }
}
