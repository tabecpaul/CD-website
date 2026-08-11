import type { ComponentType } from "react";
import AnxietyBurnout, { metadata as anxietyBurnoutMetadata } from "@/content/blog/ko/why-career-anxiety-and-burnout.mdx";
import ChangeJobs, { metadata as changeJobsMetadata } from "@/content/blog/ko/should-i-change-jobs.mdx";
import LikeVsStrength, { metadata as likeVsStrengthMetadata } from "@/content/blog/ko/what-i-like-vs-what-i-do-well.mdx";
import FourCompasses, { metadata as fourCompassesMetadata } from "@/content/blog/ko/four-career-compasses.mdx";
import AiJobAnxiety, { metadata as aiJobAnxietyMetadata } from "@/content/blog/ko/ai-job-anxiety-checklist.mdx";
import CareerTransition, { metadata as careerTransitionMetadata } from "@/content/blog/ko/before-career-transition.mdx";
import { isPublished, validateBlogMetadata, type BlogCategorySlug, type BlogPostMetadata } from "../domain";

export type BlogPost = { metadata: BlogPostMetadata; Content: ComponentType };

const candidates = [
  [anxietyBurnoutMetadata, AnxietyBurnout],
  [changeJobsMetadata, ChangeJobs],
  [likeVsStrengthMetadata, LikeVsStrength],
  [fourCompassesMetadata, FourCompasses],
  [aiJobAnxietyMetadata, AiJobAnxiety],
  [careerTransitionMetadata, CareerTransition],
] as const;

const posts: BlogPost[] = candidates.map(([rawMetadata, Content]) => ({
  metadata: validateBlogMetadata(rawMetadata),
  Content,
}));

const slugs = new Set<string>();
for (const post of posts) {
  if (slugs.has(post.metadata.slug)) throw new Error(`BLOG_SLUG_DUPLICATE:${post.metadata.slug}`);
  slugs.add(post.metadata.slug);
}

function newestFirst(a: BlogPost, b: BlogPost) {
  return b.metadata.publishedAt.localeCompare(a.metadata.publishedAt) || a.metadata.title.localeCompare(b.metadata.title, "ko");
}

export function getPublishedPosts() {
  return posts.filter((post) => isPublished(post.metadata)).sort(newestFirst);
}

export function getPostBySlug(slug: string) {
  return getPublishedPosts().find((post) => post.metadata.slug === slug) ?? null;
}

export function getPostsByCategory(category: BlogCategorySlug) {
  return getPublishedPosts().filter((post) => post.metadata.category === category);
}

export function getRelatedPosts(current: BlogPostMetadata, limit = 3) {
  return getPublishedPosts()
    .filter((post) => post.metadata.slug !== current.slug)
    .map((post) => ({
      post,
      score: (post.metadata.category === current.category ? 10 : 0)
        + post.metadata.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || newestFirst(a.post, b.post))
    .slice(0, limit)
    .map(({ post }) => post);
}
