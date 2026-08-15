import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { contentChannelTasks, contentOperationItems, contentPerformanceSnapshots, db } from "@newland/db";
import { contentDisplayStatus, type ContentChannel, type ContentTaskStatus } from "../domain";
import { seedContentOperations } from "./seed";

let seedPromise: Promise<unknown> | null = null;

async function ensureContentOperationsSeeded() {
  const [{ total }] = await db.select({ total: count() }).from(contentOperationItems);
  if (total >= 9) return;
  seedPromise ??= seedContentOperations().finally(() => { seedPromise = null; });
  await seedPromise;
}

export async function listContentOperations(now = new Date()) {
  await ensureContentOperationsSeeded();
  const rows = await db.select({ item: contentOperationItems, task: contentChannelTasks })
    .from(contentOperationItems)
    .innerJoin(contentChannelTasks, eq(contentChannelTasks.contentItemId, contentOperationItems.id))
    .orderBy(asc(contentChannelTasks.scheduledAt), asc(contentOperationItems.id), asc(contentChannelTasks.channel));

  const itemMap = new Map<number, {
    id: number;
    slug: string;
    title: string;
    category: string;
    campaign: string;
    officialUrl: string;
    isTest: boolean;
    scheduledAt: Date;
    tasks: Array<typeof rows[number]["task"] & { displayStatus: ContentTaskStatus | "due" | "overdue" }>;
  }>();
  for (const row of rows) {
    const existing = itemMap.get(row.item.id) ?? {
      id: row.item.id,
      slug: row.item.slug,
      title: row.item.title,
      category: row.item.category,
      campaign: row.item.campaign,
      officialUrl: row.item.officialUrl,
      isTest: row.item.isTest,
      scheduledAt: row.task.scheduledAt,
      tasks: [],
    };
    existing.tasks.push({ ...row.task, displayStatus: contentDisplayStatus(row.task.status as ContentTaskStatus, row.task.scheduledAt, now) });
    if (row.task.scheduledAt < existing.scheduledAt) existing.scheduledAt = row.task.scheduledAt;
    itemMap.set(row.item.id, existing);
  }
  const items = [...itemMap.values()];
  const realTasks = items.filter((item) => !item.isTest).flatMap((item) => item.tasks);
  const startOfToday = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now)}T00:00:00+09:00`);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60_000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60_000);
  return {
    items,
    summary: {
      today: realTasks.filter((task) => task.scheduledAt >= startOfToday && task.scheduledAt < endOfToday).length,
      thisWeek: realTasks.filter((task) => task.scheduledAt >= startOfToday && task.scheduledAt < endOfWeek).length,
      overdue: realTasks.filter((task) => task.displayStatus === "overdue").length,
      published: realTasks.filter((task) => task.status === "published" || task.status === "performance_checked").length,
    },
  };
}

export async function getContentOperation(id: number, now = new Date()) {
  await ensureContentOperationsSeeded();
  const [item] = await db.select().from(contentOperationItems).where(eq(contentOperationItems.id, id)).limit(1);
  if (!item) return null;
  const tasks = await db.select().from(contentChannelTasks).where(eq(contentChannelTasks.contentItemId, id)).orderBy(asc(contentChannelTasks.scheduledAt), asc(contentChannelTasks.channel));
  const taskIds = tasks.map((task) => task.id);
  const performances = taskIds.length ? await db.select().from(contentPerformanceSnapshots).where(inArray(contentPerformanceSnapshots.channelTaskId, taskIds)).orderBy(desc(contentPerformanceSnapshots.checkedAt)) : [];
  return {
    ...item,
    tasks: tasks.map((task) => ({
      ...task,
      channel: task.channel as ContentChannel,
      status: task.status as ContentTaskStatus,
      displayStatus: contentDisplayStatus(task.status as ContentTaskStatus, task.scheduledAt, now),
      latestPerformance: performances.find((performance) => performance.channelTaskId === task.id) ?? null,
    })),
  };
}

export async function updateContentTask(id: number, input: { status: "draft" | "ready" | "published"; adminNote: string | null; publishedUrl: string | null }) {
  const [current] = await db.select().from(contentChannelTasks).where(eq(contentChannelTasks.id, id)).limit(1);
  if (!current) throw new Error("CONTENT_TASK_NOT_FOUND");
  if (current.status === "performance_checked" && input.status !== "published") throw new Error("CONTENT_STATUS_CONFLICT");
  const now = new Date();
  const [updated] = await db.update(contentChannelTasks).set({
    status: input.status,
    adminNote: input.adminNote,
    publishedUrl: input.status === "published" ? input.publishedUrl : current.publishedUrl,
    publishedAt: input.status === "published" ? current.publishedAt ?? now : current.publishedAt,
    updatedAt: now,
  }).where(eq(contentChannelTasks.id, id)).returning();
  return updated;
}

export async function saveContentPerformance(id: number, input: {
  views: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  linkClicks: number | null;
  adminNote: string | null;
}) {
  return db.transaction(async (tx) => {
    const [task] = await tx.select().from(contentChannelTasks).where(eq(contentChannelTasks.id, id)).limit(1);
    if (!task) throw new Error("CONTENT_TASK_NOT_FOUND");
    if (!task.publishedUrl || (task.status !== "published" && task.status !== "performance_checked")) throw new Error("CONTENT_PERFORMANCE_REQUIRES_PUBLISHED");
    const [snapshot] = await tx.insert(contentPerformanceSnapshots).values({ channelTaskId: id, ...input }).returning();
    await tx.update(contentChannelTasks).set({ status: "performance_checked", updatedAt: new Date() }).where(and(eq(contentChannelTasks.id, id), inArray(contentChannelTasks.status, ["published", "performance_checked"])));
    return snapshot;
  });
}
