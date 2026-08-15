import { hasAdminSession } from "@/features/admin/server/auth";
import { isTrustedAdminOrigin } from "@/features/admin/server/origin";
import { resendScheduleConfirmation } from "@/features/assessment-callback/server/scheduleAdmin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTrustedAdminOrigin(request.headers.get("origin"))) return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    const result = await resendScheduleConfirmation(Number((await params).id));
    if (!result) return Response.json({ error: "schedule_not_confirmed" }, { status: 409 });
    return Response.json({ ok: result.ok, error: result.ok ? undefined : result.errorCode }, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error("Admin schedule email resend failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "schedule_email_unavailable" }, { status: 503 });
  }
}
