import {
  isContentTaskStatus,
  isContentWorkflowStatus,
  isDuplicateGateStatus,
  isSiteFirstStatus,
  normalizeContentNote,
  normalizeHttpUrl,
  normalizeMetric,
  normalizePublishedUrl,
} from "../domain";

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

function normalizeRequiredText(value: unknown, maxLength: number, errorCode: string) {
  if (typeof value !== "string") throw new Error(errorCode);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(errorCode);
  return normalized;
}

function normalizePublishDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("CONTENT_WORKFLOW_DATE_INVALID");
  const parsed = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("CONTENT_WORKFLOW_DATE_INVALID");
  return value;
}

export function workflowSourceKey(driveFolderUrl: string, proposedPublishDate: string) {
  const parsed = new URL(driveFolderUrl);
  const folderId = parsed.pathname.match(/\/folders\/([^/]+)/)?.[1];
  if (!folderId || !/^[A-Za-z0-9_-]{10,}$/.test(folderId)) throw new Error("CONTENT_WORKFLOW_DRIVE_URL_INVALID");
  return `drive:${folderId}:${proposedPublishDate}`;
}

export function parseContentWorkflowCreate(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("CONTENT_WORKFLOW_INPUT_INVALID");
  const value = input as Record<string, unknown>;
  const proposedPublishDate = normalizePublishDate(value.proposedPublishDate);
  const driveFolderUrl = normalizeHttpUrl(value.driveFolderUrl, "CONTENT_WORKFLOW_DRIVE_URL_INVALID")!;
  return {
    sourceKey: workflowSourceKey(driveFolderUrl, proposedPublishDate),
    title: normalizeRequiredText(value.title, 240, "CONTENT_WORKFLOW_TITLE_INVALID"),
    contentAxis: normalizeRequiredText(value.contentAxis, 120, "CONTENT_WORKFLOW_AXIS_INVALID"),
    proposedPublishDate,
    proposedCta: normalizeRequiredText(value.proposedCta, 160, "CONTENT_WORKFLOW_CTA_INVALID"),
    driveFolderUrl,
    adminNote: normalizeContentNote(value.adminNote),
  };
}

export function parseContentWorkflowUpdate(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("CONTENT_WORKFLOW_INPUT_INVALID");
  const value = input as Record<string, unknown>;
  if (!isContentWorkflowStatus(value.status)) throw new Error("CONTENT_WORKFLOW_STATUS_INVALID");
  if (!isDuplicateGateStatus(value.duplicateGate)) throw new Error("CONTENT_DUPLICATE_GATE_INVALID");
  if (!isSiteFirstStatus(value.siteFirstStatus)) throw new Error("CONTENT_SITE_FIRST_INVALID");
  return {
    status: value.status,
    duplicateGate: value.duplicateGate,
    siteFirstStatus: value.siteFirstStatus,
    canonicalUrl: normalizeHttpUrl(value.canonicalUrl, "CONTENT_CANONICAL_URL_INVALID", true),
    adminNote: normalizeContentNote(value.adminNote),
  };
}
