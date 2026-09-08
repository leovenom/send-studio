import type { Metadata } from "next";
import { getSiteUrl, siteConfig } from "@/lib/site";

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = !siteConfig.allowIndexing,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${getSiteUrl()}${path}`;
  const ogTitle =
    title === siteConfig.name ? siteConfig.title : `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: ogTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      ...(siteConfig.twitterHandle
        ? { creator: siteConfig.twitterHandle }
        : {}),
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
            googleBot: {
              index: false,
              follow: false,
            },
          },
        }
      : {}),
  };
}
