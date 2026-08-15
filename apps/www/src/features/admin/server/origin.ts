const DEFAULT_ADMIN_ORIGINS = [
  "https://start.careerdirect.kr",
  "https://www.careerdirect.kr",
] as const;

function httpsOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function isTrustedAdminOrigin(
  origin: string | null,
  configuredUrls: readonly (string | undefined)[] = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_OFFICIAL_SITE_URL,
  ],
) {
  const requestOrigin = httpsOrigin(origin ?? undefined);
  if (!requestOrigin || requestOrigin !== origin) return false;
  const allowedOrigins = new Set(
    [...DEFAULT_ADMIN_ORIGINS, ...configuredUrls]
      .map(httpsOrigin)
      .filter((value): value is string => value !== null),
  );
  return allowedOrigins.has(requestOrigin);
}
