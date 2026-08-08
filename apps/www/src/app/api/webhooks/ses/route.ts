import { processSesFeedback } from "@/features/lead-magnet/server/sesFeedback";
import {
  assertTrustedSnsUrl,
  parseSnsEnvelope,
  verifySnsEnvelope,
} from "@/features/lead-magnet/server/snsVerification";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 256_000;

function statusFor(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "SNS_TOPIC_UNEXPECTED") return 403;
  if (message.startsWith("SNS_SIGNATURE") || message.startsWith("SNS_CERT") || message === "SNS_URL_UNTRUSTED") return 401;
  if (message === "SES_SNS_TOPIC_ARN_MISSING") return 503;
  return 400;
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  try {
    const envelope = parseSnsEnvelope(JSON.parse(text));
    await verifySnsEnvelope(envelope);

    if (envelope.Type === "SubscriptionConfirmation") {
      const subscribeUrl = assertTrustedSnsUrl(envelope.SubscribeURL!);
      const response = await fetch(subscribeUrl, { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) throw new Error("SNS_SUBSCRIPTION_CONFIRMATION_FAILED");
      console.info("SES SNS subscription confirmed", { snsMessageId: envelope.MessageId });
      return Response.json({ ok: true, confirmed: true });
    }

    const result = await processSesFeedback(envelope.MessageId, envelope.Message);
    console.info("SES feedback processed", {
      snsMessageId: envelope.MessageId,
      eventType: result.eventType,
      duplicate: result.duplicate,
      matched: result.matched,
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error("SES feedback rejected", { errorCode: message.slice(0, 100) });
    return Response.json({ error: "invalid_notification" }, { status: statusFor(error) });
  }
}
