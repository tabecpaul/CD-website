import rawCatalog from "../contentCatalog.generated.json";
import { isContentChannel, type ContentChannel } from "../domain";
import { parseKoreaContentSchedule } from "./time";

type RawTask = {
  channel: string;
  scheduledTime: string;
  postCopy: string;
  cardSlides: string[] | null;
  altText: string | null;
  trackedUrl: string;
};

type RawItem = {
  slug: string;
  title: string;
  category: string;
  campaign: string;
  officialUrl: string;
  ctaType: string;
  ctaUrl: string;
  isTest: boolean;
  publishDate: string;
  tasks: RawTask[];
};

export type ContentSeedTask = Omit<RawTask, "channel" | "scheduledTime"> & {
  channel: ContentChannel;
  scheduledAt: Date;
};

export type ContentSeedItem = Omit<RawItem, "tasks"> & { tasks: ContentSeedTask[] };

function parseCatalogItem(item: RawItem): ContentSeedItem {
  if (!item.slug || !item.title || !item.category || !item.campaign || !item.officialUrl || !item.ctaUrl) throw new Error("CONTENT_SEED_ITEM_INVALID");
  const tasks = item.tasks.map((task) => {
    if (!isContentChannel(task.channel) || !task.postCopy || !task.trackedUrl) throw new Error(`CONTENT_SEED_TASK_INVALID:${item.slug}`);
    return { ...task, channel: task.channel, scheduledAt: parseKoreaContentSchedule(item.publishDate, task.scheduledTime) };
  });
  if (tasks.length !== 4 || new Set(tasks.map((task) => task.channel)).size !== 4) throw new Error(`CONTENT_SEED_CHANNELS_INVALID:${item.slug}`);
  return { ...item, tasks };
}

export const contentSeedItems = (rawCatalog as RawItem[]).map(parseCatalogItem);

if (contentSeedItems.length !== 9 || contentSeedItems.reduce((sum, item) => sum + item.tasks.length, 0) !== 36) {
  throw new Error("CONTENT_SEED_COUNT_INVALID");
}

