import { randomBytes } from "node:crypto";
import { leadMagnetLeads, db } from "@newland/db";
import { processDueEmailJobs, replaceLeadEmailSchedule } from "@/features/lead-magnet/server/emailAutomation";
import { recordAnalyticsEventSafely, visitorIdFromRequest } from "@/features/analytics/server/events";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONSENT_VERSION = "2026-08-09-v2";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = clean(body.email, 256)?.toLowerCase();

    if (body.company) {
      return Response.json({ ok: true }, { status: 201 });
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      return Response.json(
        { error: "올바른 이메일 주소를 입력해 주세요." },
        { status: 400 },
      );
    }

    if (body.privacyAgreed !== true) {
      return Response.json(
        { error: "PDF 제공을 위한 개인정보 수집·이용 동의가 필요합니다." },
        { status: 400 },
      );
    }

    const token = randomBytes(24).toString("hex");
    const unsubscribeToken = randomBytes(24).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const coachingAgreed = body.coachingAgreed === true;
    const [lead] = await db
      .insert(leadMagnetLeads)
      .values({
        email,
        privacyAgreed: true,
        coachingAgreed,
        consentVersion: CONSENT_VERSION,
        utmSource: clean(body.utmSource, 128),
        utmMedium: clean(body.utmMedium, 128),
        utmCampaign: clean(body.utmCampaign, 128),
        utmContent: clean(body.utmContent, 128),
        downloadToken: token,
        downloadExpiresAt: expiresAt,
        unsubscribeToken,
        lastRequestedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: leadMagnetLeads.email,
        set: {
          privacyAgreed: true,
          coachingAgreed,
          consentVersion: CONSENT_VERSION,
          utmSource: clean(body.utmSource, 128),
          utmMedium: clean(body.utmMedium, 128),
          utmCampaign: clean(body.utmCampaign, 128),
          utmContent: clean(body.utmContent, 128),
          downloadToken: token,
          downloadExpiresAt: expiresAt,
          unsubscribeToken,
          marketingUnsubscribedAt: coachingAgreed ? null : undefined,
          lastRequestedAt: now,
          updatedAt: now,
        },
      })
      .returning({ id: leadMagnetLeads.id });

    await replaceLeadEmailSchedule(lead.id, coachingAgreed, now);

    await recordAnalyticsEventSafely({
      eventName: "lead_submitted",
      anonymousId: visitorIdFromRequest(request),
      path: "/career-check",
      utm: {
        utmSource: clean(body.utmSource, 128),
        utmMedium: clean(body.utmMedium, 128),
        utmCampaign: clean(body.utmCampaign, 128),
        utmContent: clean(body.utmContent, 128),
      },
    });

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      await processDueEmailJobs(5);
    }

    return Response.json({ ok: true, token }, { status: 201 });
  } catch (error) {
    console.error("lead_capture_failed", error instanceof Error ? error.name : "unknown");
    return Response.json(
      { error: "지금은 신청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
}
