import Link from "next/link";
import { getBlogCategory, type BlogPostMetadata } from "../domain";
import BlogCover from "./BlogCover";

export default function BlogCard({ metadata, priority = false }: { metadata: BlogPostMetadata; priority?: boolean }) {
  const category = getBlogCategory(metadata.category);
  return (
    <article className="group overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/blog/${metadata.slug}`} className="block focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal">
        <BlogCover metadata={metadata} compact={!priority} />
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-navy/50">
            <span className="text-teal">{category?.label}</span><span aria-hidden="true">·</span><span>{metadata.readingMinutes}분 읽기</span>
          </div>
          <h2 className={`${priority ? "text-2xl sm:text-3xl" : "text-xl"} mt-3 font-black leading-tight text-navy`}>{metadata.title}</h2>
          <p className="mt-3 line-clamp-3 leading-7 text-navy/65">{metadata.description}</p>
          <span className="mt-5 inline-flex font-bold text-teal group-hover:underline">글 읽기 →</span>
        </div>
      </Link>
    </article>
  );
}
