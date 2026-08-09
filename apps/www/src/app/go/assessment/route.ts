import { recordAnalyticsEventSafely, visitorIdFromRequest } from "@/features/analytics/server/events";

const KOREAN_ASSESSMENT_URL = "https://careerdirect.org/?language_code=KO";
const TRACKING_TIMEOUT_MS = 1_200;

async function waitForTracking(tracking: Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      tracking,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, TRACKING_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("source");

  if (source === "pdf_qr") {
    await waitForTracking(
      recordAnalyticsEventSafely({
        eventName: "assessment_cta_clicked",
        anonymousId: visitorIdFromRequest(request),
        path: "/go/assessment",
        ctaLocation: "pdf_qr",
        utm: {
          utmSource: "pdf",
          utmMedium: "qr",
          utmCampaign: "career_direction_check",
        },
      }),
    );
  }

  return Response.redirect(KOREAN_ASSESSMENT_URL, 307);
}
