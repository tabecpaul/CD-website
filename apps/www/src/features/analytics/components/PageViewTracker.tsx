"use client";

import { useEffect } from "react";

export default function PageViewTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        eventName: "landing_viewed",
        path: window.location.pathname,
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
        utmContent: params.get("utm_content"),
      }),
      keepalive: true,
    });
  }, []);
  return null;
}
