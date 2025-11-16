import type { Metadata } from "next";
import { siteConfig, canonicalForPath } from "./site";

type MetaArgs = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  keywords?: string[];
  imageUrl?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  keywords = [],
  imageUrl,
}: MetaArgs): Metadata {
  const canonical = canonicalForPath(path);
  const image = imageUrl || siteConfig.defaultOgImage;
  return {
    title,
    description,
    keywords: Array.from(new Set([...(keywords || []), ...siteConfig.defaultKeywords])),
    alternates: { canonical },
    openGraph: {
      type,
      title,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      siteName: siteConfig.siteName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export type BreadcrumbSegment = { name: string; url: string };

export function buildBreadcrumbJsonLd(segments: BreadcrumbSegment[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: segments.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      item: s.url,
    })),
  };
}