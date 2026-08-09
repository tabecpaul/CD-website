"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

export default function TrackedExternalLink({
  ctaLocation,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { ctaLocation: string; children: ReactNode }) {
  function track() {
    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      eventId: crypto.randomUUID(),
      eventName: "assessment_cta_clicked",
      path: window.location.pathname,
      ctaLocation,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/events", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  }
  return <a {...props} onClick={track}>{children}</a>;
}
