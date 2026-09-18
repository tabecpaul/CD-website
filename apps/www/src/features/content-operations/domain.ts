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

export const contentWorkflowStatuses = [
  "proposed",
  "revision_requested",
  "approved",
  "production_ready",
  "site_published",
  "completed",
  "hold",
] as const;
export type ContentWorkflowStatus = (typeof contentWorkflowStatuses)[number];

export const contentWorkflowStatusLabels: Record<ContentWorkflowStatus, string> = {
  proposed: "제안",
  revision_requested: "수정 요청",
  approved: "승인",
  production_ready: "제작 완료",
  site_published: "사이트 선게재 완료",
  completed: "발행 완료",
  hold: "보류",
};

export const duplicateGateStatuses = ["unknown", "pass", "revise", "blocked"] as const;
export type DuplicateGateStatus = (typeof duplicateGateStatuses)[number];

export const siteFirstStatuses = ["not_applicable", "hold", "pass"] as const;
export type SiteFirstStatus = (typeof siteFirstStatuses)[number];

export function isContentWorkflowStatus(value: unknown): value is ContentWorkflowStatus {
  return typeof value === "string" && contentWorkflowStatuses.includes(value as ContentWorkflowStatus);
}

export function isDuplicateGateStatus(value: unknown): value is DuplicateGateStatus {
  return typeof value === "string" && duplicateGateStatuses.includes(value as DuplicateGateStatus);
}

export function isSiteFirstStatus(value: unknown): value is SiteFirstStatus {
  return typeof value === "string" && siteFirstStatuses.includes(value as SiteFirstStatus);
}

const workflowTransitions: Record<ContentWorkflowStatus, readonly ContentWorkflowStatus[]> = {
  proposed: ["revision_requested", "approved", "hold"],
  revision_requested: ["proposed", "approved", "hold"],
  approved: ["production_ready", "hold"],
  production_ready: ["site_published", "hold"],
  site_published: ["completed", "hold"],
  completed: [],
  hold: ["proposed", "approved", "production_ready"],
};

export function canTransitionContentWorkflow(from: ContentWorkflowStatus, to: ContentWorkflowStatus) {
  return from === to || workflowTransitions[from].includes(to);
}

export function normalizeHttpUrl(value: unknown, errorCode: string, optional = false) {
  if ((value === null || value === undefined || value === "") && optional) return null;
  if (typeof value !== "string") throw new Error(errorCode);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500) throw new Error(errorCode);
  let parsed: URL;
  try { parsed = new URL(trimmed); } catch { throw new Error(errorCode); }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error(errorCode);
  return parsed.toString();
}
