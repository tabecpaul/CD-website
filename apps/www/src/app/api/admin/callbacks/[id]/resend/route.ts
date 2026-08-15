import { hasAdminSession } from "@/features/admin/server/auth";
import { isTrustedAdminOrigin } from "@/features/admin/server/origin";
import { resendCallbackEmail } from "@/features/assessment-callback/server/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTrustedAdminOrigin(request.headers.get("origin"))) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json() as { audience?: unknown };
  if (body.audience !== "admin" && body.audience !== "customer") return Response.json({ error: "invalid_request" }, { status: 400 });
  const result = await resendCallbackEmail(Number((await params).id), body.audience);
  if (!result) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: result.ok, error: result.ok ? undefined : result.errorCode }, { status: result.ok ? 200 : 503 });
}
