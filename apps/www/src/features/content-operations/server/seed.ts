import { db, contentChannelTasks, contentOperationItems } from "@newland/db";
import { contentSeedItems } from "./seedData";

export async function seedContentOperations() {
  await db.transaction(async (tx) => {
    for (const item of contentSeedItems) {
      const [savedItem] = await tx.insert(contentOperationItems).values({
        slug: item.slug,
        title: item.title,
        category: item.category,
        campaign: item.campaign,
        officialUrl: item.officialUrl,
        ctaType: item.ctaType,
        ctaUrl: item.ctaUrl,
        isTest: item.isTest,
      }).onConflictDoUpdate({
        target: contentOperationItems.slug,
        set: {
          title: item.title,
          category: item.category,
          campaign: item.campaign,
          officialUrl: item.officialUrl,
          ctaType: item.ctaType,
          ctaUrl: item.ctaUrl,
          isTest: item.isTest,
          updatedAt: new Date(),
        },
      }).returning({ id: contentOperationItems.id });

      for (const task of item.tasks) {
        await tx.insert(contentChannelTasks).values({
          contentItemId: savedItem.id,
          channel: task.channel,
          scheduledAt: task.scheduledAt,
          postCopy: task.postCopy,
          cardSlides: task.cardSlides,
          altText: task.altText,
          trackedUrl: task.trackedUrl,
        }).onConflictDoUpdate({
          target: [contentChannelTasks.contentItemId, contentChannelTasks.channel],
          set: {
            scheduledAt: task.scheduledAt,
            postCopy: task.postCopy,
            cardSlides: task.cardSlides,
            altText: task.altText,
            trackedUrl: task.trackedUrl,
            updatedAt: new Date(),
          },
        });
      }
    }
  });
  return { items: contentSeedItems.length, tasks: contentSeedItems.reduce((sum, item) => sum + item.tasks.length, 0) };
}
