import { OFFICIAL_SITE_URL } from "@/features/site-routing/hosts";
import type { BlogPostMetadata } from "../domain";

export default function BlogArticleJsonLd({ metadata }: { metadata: BlogPostMetadata }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: metadata.title,
    description: metadata.description,
    datePublished: metadata.publishedAt,
    dateModified: metadata.updatedAt ?? metadata.publishedAt,
    inLanguage: "ko-KR",
    mainEntityOfPage: `${OFFICIAL_SITE_URL}/blog/${metadata.slug}`,
    image: `${OFFICIAL_SITE_URL}/api/blog/og/${metadata.slug}`,
    author: { "@type": "Person", name: "박정열", url: `${OFFICIAL_SITE_URL}/consultant` },
    publisher: { "@type": "Organization", name: "Career Direct Korea", url: OFFICIAL_SITE_URL },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
