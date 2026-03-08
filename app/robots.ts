import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://saljip.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"]
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL
  };
}
