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
    // These links open in a new tab, so the current page remains available while
    // the request completes. fetch gives us more consistent delivery than Beacon,
    // which can return false without sending anything in some browsers.
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }
  return <a {...props} onClick={track}>{children}</a>;
}
