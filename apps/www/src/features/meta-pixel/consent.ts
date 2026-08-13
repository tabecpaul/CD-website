export const META_CONSENT_STORAGE_KEY = "cdk_consent_v1";
export const META_CONSENT_EVENT = "cdk:meta-consent-changed";

export type MetaConsent = "essential" | "all";

export function readMetaConsent(): MetaConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(META_CONSENT_STORAGE_KEY);
    return value === "essential" || value === "all" ? value : null;
  } catch {
    return null;
  }
}

export function writeMetaConsent(value: MetaConsent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(META_CONSENT_STORAGE_KEY, value);
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent<MetaConsent>(META_CONSENT_EVENT, { detail: value }));
}

export function clearMetaConsent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(META_CONSENT_STORAGE_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent<null>(META_CONSENT_EVENT, { detail: null }));
}

export function subscribeMetaConsent(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(META_CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(META_CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function metaConsentServerSnapshot(): MetaConsent | null {
  return null;
}
