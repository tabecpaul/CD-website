import { readMetaConsent } from "./consent";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const SCRIPT_ID = "meta-pixel-script";
let initialized = false;

function pixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
}

export function initializeMetaPixel() {
  if (typeof window === "undefined" || readMetaConsent() !== "all" || !pixelId()) return false;

  if (!window.fbq) {
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else (fbq.queue ??= []).push(args);
    };
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  if (!initialized) {
    window.fbq("consent", "grant");
    window.fbq("init", pixelId());
    initialized = true;
  }
  return true;
}

export function trackMetaEvent(eventName: "PageView" | "Lead" | "Schedule") {
  try {
    if (!initializeMetaPixel() || readMetaConsent() !== "all") return;
    window.fbq?.("track", eventName);
  } catch {
    // Meta measurement must never interrupt a conversion flow.
  }
}

export function revokeMetaConsent() {
  if (typeof window === "undefined") return;
  window.fbq?.("consent", "revoke");
}
