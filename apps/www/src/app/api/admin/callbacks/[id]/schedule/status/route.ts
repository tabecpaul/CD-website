import { hasAdminSession } from "@/features/admin/server/auth";
import { updateScheduleStatus } from "@/features/assessment-callback/server/scheduleAdmin";

const actions = ["complete", "cancel", "keep_existing"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  if (request.headers.get("origin") !== new URL(siteUrl).origin) return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    const body = await request.json() as { action?: unknown };
    if (typeof body.action !== "string" || !actions.includes(body.action as typeof actions[number])) return Response.json({ error: "invalid_request" }, { status: 400 });
    const result = await updateScheduleStatus(Number((await params).id), body.action as typeof actions[number]);
    if (!result) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    const invalid = error instanceof Error && error.message === "SCHEDULE_ACTION_INVALID";
    return Response.json({ error: invalid ? "invalid_request" : "schedule_unavailable" }, { status: invalid ? 400 : 503 });
  }
}
