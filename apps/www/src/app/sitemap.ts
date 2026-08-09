import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-07");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr").replace(/\/$/, "");
  return [
    { url: siteUrl, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/career-check`, lastModified, changeFrequency: "monthly", priority: 0.95 },
    { url: `${siteUrl}/assessment-consultation`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
