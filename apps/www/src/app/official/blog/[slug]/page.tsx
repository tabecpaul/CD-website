import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogArticleJsonLd from "@/features/blog/components/BlogArticleJsonLd";
import BlogAuthor from "@/features/blog/components/BlogAuthor";
import BlogCover from "@/features/blog/components/BlogCover";
import BlogCta from "@/features/blog/components/BlogCta";
import BlogEventTracker from "@/features/blog/components/BlogEventTracker";
import RelatedPosts from "@/features/blog/components/RelatedPosts";
import { getPostBySlug, getPublishedPosts } from "@/features/blog/content/registry";
import { getBlogCategory } from "@/features/blog/domain";
import { OFFICIAL_SITE_URL } from "@/features/site-routing/hosts";

export function generateStaticParams() { return getPublishedPosts().map(({ metadata }) => ({ slug: metadata.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPostBySlug((await params).slug);
  if (!post) return {};
  const { metadata } = post;
  const image = `${OFFICIAL_SITE_URL}/api/blog/og/${metadata.slug}`;
  return {
    title: `${metadata.title} | Career Direct Korea`, description: metadata.description,
    alternates: { canonical: `/blog/${metadata.slug}` },
    openGraph: { type: "article", title: metadata.title, description: metadata.description, url: `/blog/${metadata.slug}`, publishedTime: metadata.publishedAt, modifiedTime: metadata.updatedAt, images: [{ url: image, width: 1200, height: 630, alt: metadata.coverAlt }] },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPostBySlug((await params).slug);
  if (!post) notFound();
  const { metadata, Content } = post;
  const category = getBlogCategory(metadata.category);
  return <>
    <BlogEventTracker eventName="blog_article_viewed" ctaLocation={`article:${metadata.slug}`} />
    <BlogArticleJsonLd metadata={metadata} />
    <article className="px-5 py-12 sm:px-8 sm:py-20"><div className="mx-auto max-w-4xl"><Link href="/blog" className="text-sm font-bold text-teal">← 블로그 전체</Link><header className="mt-9"><p className="text-sm font-black text-teal">{category?.label}</p><h1 className="mt-4 text-4xl font-black leading-tight text-navy sm:text-6xl">{metadata.title}</h1><p className="mt-6 text-lg leading-8 text-navy/65">{metadata.description}</p><div className="mt-7"><BlogAuthor compact /></div></header><div className="mt-10 overflow-hidden rounded-[2rem]"><BlogCover metadata={metadata} /></div><div className="prose-blog mt-12"><Content /></div>{metadata.references.length ? <section className="mt-14 border-t border-navy/10 pt-8"><h2 className="text-2xl font-black text-navy">참고 자료</h2><ul className="mt-4 space-y-3">{metadata.references.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer" className="font-bold text-teal underline underline-offset-4">{reference.title}</a></li>)}</ul></section> : null}<BlogCta type={metadata.cta} /><RelatedPosts current={metadata} /><div className="mt-14"><BlogAuthor /></div></div></article>
  </>;
}
