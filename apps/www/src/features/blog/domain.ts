export const blogCategories = [
  { slug: "career-reality", label: "현실 진로", description: "진로 불안과 현실적인 선택 기준을 다룹니다." },
  { slug: "self-understanding", label: "자기이해", description: "성격·흥미·재능·가치관을 이해하는 방법을 다룹니다." },
  { slug: "career-transition", label: "이직·경력전환", description: "이직과 경력 전환 전에 확인할 현실 조건을 다룹니다." },
  { slug: "ai-and-work", label: "AI와 일", description: "AI 시대의 직업 변화와 준비 방법을 다룹니다." },
  { slug: "faith-and-calling", label: "신앙과 소명", description: "신앙과 일, 부르심을 책임 있게 분별하는 관점을 다룹니다." },
] as const;

export type BlogCategorySlug = (typeof blogCategories)[number]["slug"];
export type BlogCta = "self-check" | "callback";
export type BlogStatus = "draft" | "published";

export type BlogReference = { title: string; url: string };

export type BlogPostMetadata = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: "park-jung-yull";
  category: BlogCategorySlug;
  tags: readonly string[];
  featured: boolean;
  coverAlt: string;
  cta: BlogCta;
  status: BlogStatus;
  references: readonly BlogReference[];
  readingMinutes: number;
};

export function getBlogCategory(slug: string) {
  return blogCategories.find((category) => category.slug === slug) ?? null;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requiredString(value: unknown, field: string, slug = "unknown") {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`BLOG_METADATA_INVALID:${slug}:${field}`);
  }
  return value.trim();
}

function validDate(value: unknown, field: string, slug: string) {
  const date = requiredString(value, field, slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00+09:00`))) {
    throw new Error(`BLOG_METADATA_INVALID:${slug}:${field}`);
  }
  return date;
}

export function validateBlogMetadata(value: unknown): BlogPostMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("BLOG_METADATA_INVALID:unknown:root");
  const input = value as Record<string, unknown>;
  const slug = requiredString(input.slug, "slug");
  if (!SLUG.test(slug)) throw new Error(`BLOG_METADATA_INVALID:${slug}:slug`);
  const title = requiredString(input.title, "title", slug);
  const description = requiredString(input.description, "description", slug);
  if (title.length > 90 || description.length > 180) throw new Error(`BLOG_METADATA_INVALID:${slug}:length`);
  const publishedAt = validDate(input.publishedAt, "publishedAt", slug);
  const updatedAt = input.updatedAt == null ? undefined : validDate(input.updatedAt, "updatedAt", slug);
  if (updatedAt && updatedAt < publishedAt) throw new Error(`BLOG_METADATA_INVALID:${slug}:updatedAt`);
  if (input.author !== "park-jung-yull") throw new Error(`BLOG_METADATA_INVALID:${slug}:author`);
  if (typeof input.category !== "string" || !getBlogCategory(input.category)) throw new Error(`BLOG_METADATA_INVALID:${slug}:category`);
  if (input.cta !== "self-check" && input.cta !== "callback") throw new Error(`BLOG_METADATA_INVALID:${slug}:cta`);
  if (input.status !== "draft" && input.status !== "published") throw new Error(`BLOG_METADATA_INVALID:${slug}:status`);
  if (typeof input.featured !== "boolean") throw new Error(`BLOG_METADATA_INVALID:${slug}:featured`);
  if (!Array.isArray(input.tags) || input.tags.some((tag) => typeof tag !== "string" || !tag.trim())) throw new Error(`BLOG_METADATA_INVALID:${slug}:tags`);
  const tags = [...new Set(input.tags.map((tag) => String(tag).trim()))];
  if (!Array.isArray(input.references)) throw new Error(`BLOG_METADATA_INVALID:${slug}:references`);
  const references = input.references.map((reference) => {
    if (!reference || typeof reference !== "object" || Array.isArray(reference)) throw new Error(`BLOG_METADATA_INVALID:${slug}:references`);
    const record = reference as Record<string, unknown>;
    const url = requiredString(record.url, "reference.url", slug);
    if (!url.startsWith("https://")) throw new Error(`BLOG_METADATA_INVALID:${slug}:reference.url`);
    return { title: requiredString(record.title, "reference.title", slug), url };
  });
  const readingMinutes = Number(input.readingMinutes);
  if (!Number.isInteger(readingMinutes) || readingMinutes < 1 || readingMinutes > 30) throw new Error(`BLOG_METADATA_INVALID:${slug}:readingMinutes`);
  return {
    title, description, slug, publishedAt, updatedAt,
    author: "park-jung-yull",
    category: input.category as BlogCategorySlug,
    tags, featured: input.featured,
    coverAlt: requiredString(input.coverAlt, "coverAlt", slug),
    cta: input.cta, status: input.status, references, readingMinutes,
  };
}

export function isPublished(metadata: BlogPostMetadata, now = new Date()) {
  const release = new Date(`${metadata.publishedAt}T00:00:00+09:00`);
  return metadata.status === "published" && release.getTime() <= now.getTime();
}
