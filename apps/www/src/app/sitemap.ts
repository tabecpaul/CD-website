import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-07");
  return [
    { url: "https://www.careerdirect.kr", lastModified, changeFrequency: "monthly", priority: 1 },
    { url: "https://www.careerdirect.kr/career-check", lastModified, changeFrequency: "monthly", priority: 0.95 },
    { url: "https://www.careerdirect.kr/privacy", lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
