import { randomUUID } from "node:crypto";
import { parsePublicEvent, recordAnalyticsEvent, validVisitorId } from "@/features/analytics/server/events";

const MAX_BODY_BYTES = 4_096;
const COOKIE = "cdk_vid";

export async function POST(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  if (request.headers.get("origin") !== new URL(siteUrl).origin) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }
  let event: ReturnType<typeof parsePublicEvent>;
  try {
    event = parsePublicEvent(JSON.parse(text));
    if (event.eventName !== "landing_viewed" && event.eventName !== "assessment_cta_clicked") {
      throw new Error("ANALYTICS_PUBLIC_EVENT_FORBIDDEN");
    }
  } catch {
    return Response.json({ error: "invalid_event" }, { status: 400 });
  }
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const existing = cookieHeader.match(/(?:^|;\s*)cdk_vid=([^;]+)/)?.[1];
    const anonymousId = validVisitorId(existing) ?? randomUUID();
    await recordAnalyticsEvent({ ...event, anonymousId, utm: event });
    const response = Response.json({ ok: true });
    if (!validVisitorId(existing)) {
      response.headers.append("Set-Cookie", `${COOKIE}=${anonymousId}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`);
    }
    return response;
  } catch (error) {
    console.error("Public analytics event failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN" });
    return Response.json({ error: "event_unavailable" }, { status: 503 });
  }
}
