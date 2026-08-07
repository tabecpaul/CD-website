import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/career-check/thank-you", "/api/"] },
    sitemap: "https://www.careerdirect.kr/sitemap.xml",
  };
}
