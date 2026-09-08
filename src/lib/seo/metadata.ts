import type { Metadata } from "next";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { ogImageSize } from "@/lib/seo/og-image";

function resolveOgImagePath(path: string): string {
  return path === "/" ? "/opengraph-image" : `${path}/opengraph-image`;
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = !siteConfig.allowIndexing,
  ogImageAlt,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  ogImageAlt?: string;
}): Metadata {
  const url = `${getSiteUrl()}${path}`;
  const ogTitle =
    title === siteConfig.name ? siteConfig.title : `${title} | ${siteConfig.name}`;
  const ogImagePath = resolveOgImagePath(path);
  const imageAlt = ogImageAlt ?? ogTitle;
  const ogImage = {
    url: ogImagePath,
    width: ogImageSize.width,
    height: ogImageSize.height,
    alt: imageAlt,
  };

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
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImagePath],
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

export function createDefaultOgMetadata(): Pick<Metadata, "openGraph" | "twitter"> {
  const ogImagePath = "/opengraph-image";
  const ogImage = {
    url: ogImagePath,
    width: ogImageSize.width,
    height: ogImageSize.height,
    alt: siteConfig.title,
  };

  return {
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      images: [ogImagePath],
    },
  };
}
