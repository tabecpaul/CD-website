import { and, desc, eq, gte } from "drizzle-orm";
import { assessmentCallbackRequests, db } from "@newland/db";
import { CALLBACK_CONSENT_VERSION } from "@/features/assessment-callback/domain";
import { sendAdminCallbackEmail, sendCustomerCallbackEmail } from "@/features/assessment-callback/server/emails";
import { parseCallbackSubmission } from "@/features/assessment-callback/server/validation";
import { firstAttribution, recordAnalyticsEventSafely, visitorIdFromRequest } from "@/features/analytics/server/events";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  if (request.headers.get("origin") !== requestOrigin) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let input: ReturnType<typeof parseCallbackSubmission>;
  try {
    input = parseCallbackSubmission(JSON.parse(text));
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "invalid_request",
    }, { status: 400 });
  }

  try {
    const anonymousId = visitorIdFromRequest(request);
    const fallbackAttribution = input.utmSource || input.utmMedium || input.utmCampaign || input.utmContent
      ? {}
      : await firstAttribution(anonymousId);
    const attributedInput = {
      ...input,
      utmSource: input.utmSource ?? fallbackAttribution.utmSource ?? null,
      utmMedium: input.utmMedium ?? fallbackAttribution.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? fallbackAttribution.utmCampaign ?? null,
      utmContent: input.utmContent ?? fallbackAttribution.utmContent ?? null,
    };
    const duplicateSince = new Date(Date.now() - 10 * 60_000);
    const duplicate = await db.query.assessmentCallbackRequests.findFirst({
      where: and(
        eq(assessmentCallbackRequests.email, input.email),
        eq(assessmentCallbackRequests.phone, input.phone),
        gte(assessmentCallbackRequests.createdAt, duplicateSince),
      ),
      orderBy: [desc(assessmentCallbackRequests.createdAt)],
      columns: { id: true },
    });
    if (duplicate) return Response.json({ ok: true }, { status: 201 });

    const [created] = await db.insert(assessmentCallbackRequests).values({
      ...attributedInput,
      anonymousId,
      consentVersion: CALLBACK_CONSENT_VERSION,
    }).returning({ id: assessmentCallbackRequests.id });

    await recordAnalyticsEventSafely({
      eventName: "callback_submitted",
      anonymousId,
      path: "/assessment-consultation",
      ctaLocation: input.ctaLocation,
      utm: attributedInput,
    });

    const [adminResult, customerResult] = await Promise.all([
      sendAdminCallbackEmail(created.id, input),
      sendCustomerCallbackEmail(input),
    ]);
    await db.update(assessmentCallbackRequests).set({
      adminEmailStatus: adminResult.ok ? "sent" : "failed",
      adminEmailId: adminResult.ok ? adminResult.providerMessageId : null,
      adminEmailError: adminResult.ok ? null : adminResult.errorCode,
      customerEmailStatus: customerResult.ok ? "sent" : "failed",
      customerEmailId: customerResult.ok ? customerResult.providerMessageId : null,
      customerEmailError: customerResult.ok ? null : customerResult.errorCode,
      updatedAt: new Date(),
    }).where(eq(assessmentCallbackRequests.id, created.id));

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Assessment callback submission failed", {
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
    });
    return Response.json({ ok: false, error: "submission_unavailable" }, { status: 503 });
  }
}
