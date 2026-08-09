import { hasAdminSession } from "@/features/admin/server/auth";
import { updateCallbackRequest } from "@/features/assessment-callback/server/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  if (request.headers.get("origin") !== new URL(siteUrl).origin) return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    const id = Number((await params).id);
    const updated = await updateCallbackRequest(id, await request.json());
    if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
}
