import type { MetadataRoute } from "next";
import { getSiteUrl, publicRoutes, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteConfig.allowIndexing) {
    return [];
  }

  const base = getSiteUrl();
  const now = new Date();

  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
