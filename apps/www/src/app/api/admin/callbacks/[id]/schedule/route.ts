import { hasAdminSession } from "@/features/admin/server/auth";
import { isTrustedAdminOrigin } from "@/features/admin/server/origin";
import { confirmCallbackSchedule } from "@/features/assessment-callback/server/scheduleAdmin";
import { parseScheduleInput } from "@/features/assessment-callback/server/scheduleValidation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTrustedAdminOrigin(request.headers.get("origin"))) return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2_000) return Response.json({ error: "invalid_request" }, { status: 413 });
    const id = Number((await params).id);
    const input = parseScheduleInput(await request.json());
    const result = await confirmCallbackSchedule(id, input.start, input.end, input.conflictConfirmed);
    if (!result) return Response.json({ error: "not_found" }, { status: 404 });
    if (result.kind === "conflict") {
      return Response.json({ error: "schedule_conflict", conflicts: result.conflicts.map((item) => ({ id: item.id, start: item.confirmedStartAt, end: item.confirmedEndAt })) }, { status: 409 });
    }
    return Response.json({ ok: true, emailSent: result.email?.ok === true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SCHEDULE_UNAVAILABLE";
    const invalid = code === "SCHEDULE_INPUT_INVALID" || code === "SCHEDULE_IN_PAST";
    console.error("Admin callback schedule confirmation failed", { errorCode: code.slice(0, 80) });
    return Response.json({ error: invalid ? code.toLowerCase() : "schedule_unavailable" }, { status: invalid ? 400 : 503 });
  }
}
