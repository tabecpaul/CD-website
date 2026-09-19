export const contentChannels = ["naver_blog", "instagram", "facebook", "threads"] as const;
export type ContentChannel = (typeof contentChannels)[number];

export const contentChannelLabels: Record<ContentChannel, string> = {
  naver_blog: "네이버 블로그",
  instagram: "인스타그램",
  facebook: "페이스북",
  threads: "Threads",
};

export const contentTaskStatuses = ["draft", "ready", "published", "performance_checked"] as const;
export type ContentTaskStatus = (typeof contentTaskStatuses)[number];

export const contentTaskStatusLabels: Record<ContentTaskStatus | "due" | "overdue", string> = {
  draft: "문안 준비 중",
  ready: "게시 준비 완료",
  due: "발행 시각 도래",
  overdue: "확인 지연",
  published: "발행 완료",
  performance_checked: "성과 확인 완료",
};

export const contentNotificationKinds = ["day_before", "publish_soon", "performance_followup"] as const;
export type ContentNotificationKind = (typeof contentNotificationKinds)[number];

export function isContentChannel(value: unknown): value is ContentChannel {
  return typeof value === "string" && contentChannels.includes(value as ContentChannel);
}

export function isContentTaskStatus(value: unknown): value is ContentTaskStatus {
  return typeof value === "string" && contentTaskStatuses.includes(value as ContentTaskStatus);
}

export function contentDisplayStatus(status: ContentTaskStatus, scheduledAt: Date, now = new Date()) {
  if (status === "published" || status === "performance_checked") return status;
  if (scheduledAt.getTime() > now.getTime()) return status;
  if (now.getTime() - scheduledAt.getTime() >= 30 * 60_000) return "overdue" as const;
  return "due" as const;
}

export function normalizePublishedUrl(value: unknown) {
  if (typeof value !== "string") throw new Error("PUBLISHED_URL_INVALID");
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2_000) throw new Error("PUBLISHED_URL_INVALID");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("PUBLISHED_URL_INVALID");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("PUBLISHED_URL_INVALID");
  return parsed.toString();
}

export function normalizeMetric(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error("PERFORMANCE_VALUE_INVALID");
  return number;
}

export function normalizeContentNote(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > 2_000) throw new Error("CONTENT_NOTE_INVALID");
  return value.trim() || null;
}

