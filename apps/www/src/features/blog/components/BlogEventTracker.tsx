"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsEventName } from "@/features/analytics/server/events";

export function sendBlogEvent(eventName: AnalyticsEventName, ctaLocation?: string) {
  const params = new URLSearchParams(window.location.search);
  return fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: crypto.randomUUID(), eventName, path: window.location.pathname, ctaLocation,
      utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"), utmContent: params.get("utm_content"),
    }),
    keepalive: true,
  });
}

export default function BlogEventTracker({ eventName, ctaLocation }: { eventName: AnalyticsEventName; ctaLocation?: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void sendBlogEvent(eventName, ctaLocation);
  }, [eventName, ctaLocation]);
  return null;
}
