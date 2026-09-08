import type { MetadataRoute } from "next";
import { getSiteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  if (!siteConfig.allowIndexing) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      host: base,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
