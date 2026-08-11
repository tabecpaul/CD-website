import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "@/features/blog/components/BlogCard";
import { getPostsByCategory } from "@/features/blog/content/registry";
import { blogCategories, getBlogCategory, type BlogCategorySlug } from "@/features/blog/domain";

export function generateStaticParams() { return blogCategories.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getBlogCategory(slug);
  if (!category) return {};
  return { title: `${category.label} | Career Direct Korea 블로그`, description: category.description, alternates: { canonical: `/blog/category/${slug}` } };
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getBlogCategory(slug);
  if (!category) notFound();
  const posts = getPostsByCategory(slug as BlogCategorySlug);
  return <><section className="bg-cream px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-6xl"><Link href="/blog" className="text-sm font-bold text-teal">← 블로그 전체</Link><p className="mt-8 text-xs font-black tracking-[.18em] text-teal">BLOG CATEGORY</p><h1 className="mt-4 text-4xl font-black text-navy sm:text-6xl">{category.label}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-navy/65">{category.description}</p></div></section><section className="px-5 py-14 sm:px-8"><div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.metadata.slug} metadata={post.metadata} />)}{posts.length === 0 ? <p className="text-navy/60">준비 중인 글입니다.</p> : null}</div></section></>;
}
