import type { ComponentType } from "react";
import AnxietyBurnout, { metadata as anxietyBurnoutMetadata } from "@/content/blog/ko/why-career-anxiety-and-burnout.mdx";
import ChangeJobs, { metadata as changeJobsMetadata } from "@/content/blog/ko/should-i-change-jobs.mdx";
import LikeVsStrength, { metadata as likeVsStrengthMetadata } from "@/content/blog/ko/what-i-like-vs-what-i-do-well.mdx";
import FourCompasses, { metadata as fourCompassesMetadata } from "@/content/blog/ko/four-career-compasses.mdx";
import AiJobAnxiety, { metadata as aiJobAnxietyMetadata } from "@/content/blog/ko/ai-job-anxiety-checklist.mdx";
import CareerTransition, { metadata as careerTransitionMetadata } from "@/content/blog/ko/before-career-transition.mdx";
import CallingMoreThanJob, { metadata as callingMoreThanJobMetadata } from "@/content/blog/ko/calling-is-more-than-a-job.mdx";
import DiscerningGodsWill, { metadata as discerningGodsWillMetadata } from "@/content/blog/ko/five-tests-for-discerning-gods-will.mdx";
import GiftsTalentsStrengths, { metadata as giftsTalentsStrengthsMetadata } from "@/content/blog/ko/gifts-talents-strengths.mdx";
import DecisionDelay, { metadata as decisionDelayMetadata } from "@/content/blog/ko/decision-delay-is-not-only-lack-of-information.mdx";
import ValuesConflict, { metadata as valuesConflictMetadata } from "@/content/blog/ko/values-conflict-at-work.mdx";
import CareerCriteria, { metadata as careerCriteriaMetadata } from "@/content/blog/ko/career-criteria-before-changing-jobs.mdx";
import SustainableWork, { metadata as sustainableWorkMetadata } from "@/content/blog/ko/good-at-vs-sustainable-work.mdx";
import ParentExpectations, { metadata as parentExpectationsMetadata } from "@/content/blog/ko/career-between-parent-expectations-and-self.mdx";
import CareerGap, { metadata as careerGapMetadata } from "@/content/blog/ko/career-gap-as-evidence.mdx";
import MajorChoice, { metadata as majorChoiceMetadata } from "@/content/blog/ko/major-choice-beyond-favorite-subject.mdx";
import MinistryRole, { metadata as ministryRoleMetadata } from "@/content/blog/ko/calling-beyond-changing-ministry-role.mdx";
import RetirementCareer, { metadata as retirementCareerMetadata } from "@/content/blog/ko/second-career-after-retirement.mdx";
import { isPublished, validateBlogMetadata, type BlogCategorySlug, type BlogPostMetadata } from "../domain";

export type BlogPost = { metadata: BlogPostMetadata; Content: ComponentType };

const candidates = [
  [anxietyBurnoutMetadata, AnxietyBurnout],
  [changeJobsMetadata, ChangeJobs],
  [likeVsStrengthMetadata, LikeVsStrength],
  [fourCompassesMetadata, FourCompasses],
  [aiJobAnxietyMetadata, AiJobAnxiety],
  [careerTransitionMetadata, CareerTransition],
  [callingMoreThanJobMetadata, CallingMoreThanJob],
  [discerningGodsWillMetadata, DiscerningGodsWill],
  [giftsTalentsStrengthsMetadata, GiftsTalentsStrengths],
  [decisionDelayMetadata, DecisionDelay],
  [valuesConflictMetadata, ValuesConflict],
  [careerCriteriaMetadata, CareerCriteria],
  [sustainableWorkMetadata, SustainableWork],
  [parentExpectationsMetadata, ParentExpectations],
  [careerGapMetadata, CareerGap],
  [majorChoiceMetadata, MajorChoice],
  [ministryRoleMetadata, MinistryRole],
  [retirementCareerMetadata, RetirementCareer],
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
