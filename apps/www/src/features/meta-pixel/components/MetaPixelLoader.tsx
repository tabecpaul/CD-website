"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { metaConsentServerSnapshot, readMetaConsent, subscribeMetaConsent } from "../consent";
import { revokeMetaConsent, trackMetaEvent } from "../client";

export default function MetaPixelLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useSyncExternalStore(subscribeMetaConsent, readMetaConsent, metaConsentServerSnapshot);
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== "all") {
      revokeMetaConsent();
      lastTrackedUrl.current = null;
    }
  }, [consent]);

  useEffect(() => {
    if (consent !== "all") return;
    const query = searchParams.toString();
    const currentUrl = `${pathname}${query ? `?${query}` : ""}`;
    if (lastTrackedUrl.current === currentUrl) return;
    trackMetaEvent("PageView");
    lastTrackedUrl.current = currentUrl;
  }, [consent, pathname, searchParams]);

  return null;
}
