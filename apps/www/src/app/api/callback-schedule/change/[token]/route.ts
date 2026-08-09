import { requestCallbackReschedule } from "@/features/assessment-callback/server/reschedule";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  if (request.headers.get("origin") !== new URL(siteUrl).origin) return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 4_000) return Response.json({ error: "invalid_request" }, { status: 413 });
    const result = await requestCallbackReschedule((await params).token, await request.json());
    if (!result) return Response.json({ error: "link_unavailable" }, { status: 404 });
    return Response.json({ ok: true, duplicate: result.duplicate });
  } catch (error) {
    const invalid = error instanceof Error && error.message === "RESCHEDULE_INPUT_INVALID";
    return Response.json({ error: invalid ? "invalid_request" : "request_unavailable" }, { status: invalid ? 400 : 503 });
  }
}
