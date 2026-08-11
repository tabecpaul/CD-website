import type { Metadata } from "next";
import Link from "next/link";
import BlogCard from "@/features/blog/components/BlogCard";
import { getPublishedPosts } from "@/features/blog/content/registry";
import { blogCategories } from "@/features/blog/domain";

export const metadata: Metadata = {
  title: "진로 블로그 | Career Direct Korea",
  description: "진로 불안, 자기이해, 이직과 경력 전환, AI 시대의 일을 현실적인 질문과 실행 도구로 정리합니다.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getPublishedPosts();
  const featured = posts.find((post) => post.metadata.featured) ?? posts[0];
  const rest = posts.filter((post) => post.metadata.slug !== featured?.metadata.slug);
  return <>
    <section className="bg-cream px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-6xl"><p className="text-xs font-black tracking-[.18em] text-teal">CAREER INSIGHTS</p><h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-navy sm:text-6xl">현실의 진로 문제를<br />분명한 질문과 실행으로</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-navy/65">성격·흥미·재능·가치관을 바탕으로 이직, 번아웃, AI 변화와 경력 전환을 차분히 풀어갑니다.</p><nav aria-label="블로그 카테고리" className="mt-9 flex flex-wrap gap-2">{blogCategories.map((category) => <Link key={category.slug} href={`/blog/category/${category.slug}`} className="rounded-full border border-navy/10 bg-white px-4 py-2 text-sm font-bold text-navy transition hover:border-teal hover:text-teal">{category.label}</Link>)}</nav></div></section>
    <section className="px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-6xl">{featured ? <BlogCard metadata={featured.metadata} priority /> : null}<div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{rest.map((post) => <BlogCard key={post.metadata.slug} metadata={post.metadata} />)}</div></div></section>
  </>;
}
