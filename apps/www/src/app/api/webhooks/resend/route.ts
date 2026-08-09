import { Resend } from "resend";
import {
  processResendFeedback,
  type ResendEmailEvent,
} from "@/features/lead-magnet/server/resendFeedback";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 256_000;

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return Response.json({ error: "webhook_not_configured" }, { status: 503 });

  const payload = await request.text();
  if (Buffer.byteLength(payload, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return Response.json({ error: "signature_headers_missing" }, { status: 401 });
  }

  try {
    const event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    });
    const result = await processResendFeedback(id, event as ResendEmailEvent);
    console.info("Resend feedback processed", result);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Resend feedback rejected", {
      errorCode: error instanceof Error ? error.message.slice(0, 100) : "UNKNOWN",
    });
    return Response.json({ error: "invalid_notification" }, { status: 401 });
  }
}
