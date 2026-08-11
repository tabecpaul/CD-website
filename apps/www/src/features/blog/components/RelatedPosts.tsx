import type { BlogPostMetadata } from "../domain";
import { getRelatedPosts } from "../content/registry";
import TrackedBlogLink from "./TrackedBlogLink";

export default function RelatedPosts({ current }: { current: BlogPostMetadata }) {
  const posts = getRelatedPosts(current);
  if (!posts.length) return null;
  return <section className="mt-16 border-t border-navy/10 pt-10"><p className="text-xs font-black tracking-[.16em] text-teal">KEEP READING</p><h2 className="mt-2 text-3xl font-black text-navy">이어 읽으면 좋은 글</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{posts.map(({ metadata }) => <TrackedBlogLink key={metadata.slug} href={`/blog/${metadata.slug}`} trackingLocation={`related:${current.slug}:${metadata.slug}`} className="rounded-2xl border border-navy/10 bg-cream p-6 transition hover:-translate-y-1 hover:shadow-lg"><p className="text-xs font-bold text-teal">{metadata.readingMinutes}분 읽기</p><h3 className="mt-3 text-xl font-black leading-tight text-navy">{metadata.title}</h3><span className="mt-5 inline-block font-bold text-teal">글 읽기 →</span></TrackedBlogLink>)}</div></section>;
}
