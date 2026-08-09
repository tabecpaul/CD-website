import { recordAnalyticsEventSafely, visitorIdFromRequest } from "@/features/analytics/server/events";

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
  const attribution = source === "pdf_qr"
    ? { utmSource: "pdf", utmMedium: "qr", utmCampaign: "career_direction_check", ctaLocation: "pdf_qr" }
    : source === "coaching_3"
      ? { utmSource: "email", utmMedium: "coaching", utmCampaign: "coaching_3", ctaLocation: "coaching_3" }
      : null;

  if (attribution) {
    await waitForTracking(
      recordAnalyticsEventSafely({
        eventName: "callback_cta_clicked",
        anonymousId: visitorIdFromRequest(request),
        path: "/go/assessment",
        ctaLocation: attribution.ctaLocation,
        utm: attribution,
      }),
    );
  }

  const destination = new URL("/assessment-consultation", request.url);
  if (attribution) {
    destination.searchParams.set("source", source ?? "");
    destination.searchParams.set("cta_location", attribution.ctaLocation);
    destination.searchParams.set("utm_source", attribution.utmSource);
    destination.searchParams.set("utm_medium", attribution.utmMedium);
    destination.searchParams.set("utm_campaign", attribution.utmCampaign);
  }
  return Response.redirect(destination, 307);
}
