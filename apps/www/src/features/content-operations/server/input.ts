import { isContentTaskStatus, normalizeContentNote, normalizeMetric, normalizePublishedUrl } from "../domain";

export function parseContentTaskUpdate(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("CONTENT_INPUT_INVALID");
  const value = input as Record<string, unknown>;
  if (!isContentTaskStatus(value.status) || value.status === "performance_checked") throw new Error("CONTENT_STATUS_INVALID");
  const adminNote = normalizeContentNote(value.adminNote);
  const publishedUrl = value.status === "published" ? normalizePublishedUrl(value.publishedUrl) : null;
  return { status: value.status, adminNote, publishedUrl };
}

export function parseContentPerformance(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("CONTENT_INPUT_INVALID");
  const value = input as Record<string, unknown>;
  return {
    views: normalizeMetric(value.views),
    likes: normalizeMetric(value.likes),
    comments: normalizeMetric(value.comments),
    saves: normalizeMetric(value.saves),
    shares: normalizeMetric(value.shares),
    linkClicks: normalizeMetric(value.linkClicks),
    adminNote: normalizeContentNote(value.adminNote),
  };
}

export function parsePositiveId(value: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("CONTENT_ID_INVALID");
  return id;
}

