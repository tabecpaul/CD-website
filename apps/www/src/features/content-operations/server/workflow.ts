import { asc, eq } from "drizzle-orm";
import { contentWorkflowItems, db } from "@newland/db";
import {
  canTransitionContentWorkflow,
  type ContentWorkflowStatus,
  type DuplicateGateStatus,
  type SiteFirstStatus,
} from "../domain";

export async function listContentWorkflowItems() {
  try {
    const items = await db.select().from(contentWorkflowItems)
      .orderBy(asc(contentWorkflowItems.proposedPublishDate), asc(contentWorkflowItems.id));
    return {
      items,
      pending: items.filter((item) => item.status !== "completed" && item.status !== "hold").length,
      unavailable: false,
    };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "42P01") return { items: [], pending: 0, unavailable: true };
    throw error;
  }
}

export async function getContentWorkflowItem(id: number) {
  const [item] = await db.select().from(contentWorkflowItems).where(eq(contentWorkflowItems.id, id)).limit(1);
  return item ?? null;
}

export async function createContentWorkflowItem(input: {
  sourceKey: string;
  title: string;
  contentAxis: string;
  proposedPublishDate: string;
  proposedCta: string;
  driveFolderUrl: string;
  adminNote: string | null;
}) {
  const [created] = await db.insert(contentWorkflowItems).values(input).onConflictDoNothing({
    target: contentWorkflowItems.sourceKey,
  }).returning();
  if (created) return { item: created, created: true };
  const [existing] = await db.select().from(contentWorkflowItems)
    .where(eq(contentWorkflowItems.sourceKey, input.sourceKey)).limit(1);
  if (!existing) throw new Error("CONTENT_WORKFLOW_CREATE_FAILED");
  return { item: existing, created: false };
}

export async function updateContentWorkflowItem(id: number, input: {
  status: ContentWorkflowStatus;
  duplicateGate: DuplicateGateStatus;
  siteFirstStatus: SiteFirstStatus;
  canonicalUrl: string | null;
  adminNote: string | null;
}) {
  const current = await getContentWorkflowItem(id);
  if (!current) throw new Error("CONTENT_WORKFLOW_NOT_FOUND");
  const currentStatus = current.status as ContentWorkflowStatus;
  if (!canTransitionContentWorkflow(currentStatus, input.status)) throw new Error("CONTENT_WORKFLOW_TRANSITION_INVALID");
  if (["approved", "production_ready", "site_published", "completed"].includes(input.status) && input.duplicateGate !== "pass") {
    throw new Error("CONTENT_DUPLICATE_GATE_REQUIRED");
  }
  if (["site_published", "completed"].includes(input.status) && (input.siteFirstStatus !== "pass" || !input.canonicalUrl)) {
    throw new Error("CONTENT_SITE_FIRST_REQUIRED");
  }

  const now = new Date();
  const timestamps = {
    approvedAt: input.status === "approved" ? current.approvedAt ?? now : current.approvedAt,
    productionReadyAt: input.status === "production_ready" ? current.productionReadyAt ?? now : current.productionReadyAt,
    sitePublishedAt: input.status === "site_published" ? current.sitePublishedAt ?? now : current.sitePublishedAt,
    completedAt: input.status === "completed" ? current.completedAt ?? now : current.completedAt,
  };
  const [updated] = await db.update(contentWorkflowItems).set({
    ...input,
    ...timestamps,
    updatedAt: now,
  }).where(eq(contentWorkflowItems.id, id)).returning();
  return updated;
}
