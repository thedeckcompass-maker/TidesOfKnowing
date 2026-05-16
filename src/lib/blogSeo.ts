import type { CollectionEntry } from "astro:content";
import { ENTITY_IDS } from "./ecosystem-structured-data";

type BlogEntry = CollectionEntry<"blog">;

export type BlogSeoInput = {
  entry: BlogEntry;
  /** Absolute canonical / OG URL for this page. */
  pageUrl: string;
  baseHref: string;
  /** Fallback when no hero/og image is set. */
  defaultOgImage: string;
  /** e.g. "Field Notes | Tides of Knowing" */
  titleSuffix?: string;
};

export type BlogSeoResolved = {
  pageTitle: string;
  metaDescription: string;
  ogUrl: string;
  ogImageAbsolute: string;
  ogTitle: string;
  ogDescription: string;
  datePublished: string;
  dateModified: string;
};

const DEFAULT_SUFFIX = "Field Notes | Tides of Knowing";
const AUTHOR_NAME = "Leigh Spencer";
const ABOUT_PATH = "/about/";

export { AUTHOR_NAME, ABOUT_PATH };

export function resolveBlogSeo({
  entry,
  pageUrl,
  baseHref,
  defaultOgImage,
  titleSuffix = DEFAULT_SUFFIX,
}: BlogSeoInput): BlogSeoResolved {
  const { data } = entry;
  const headline = data.title;
  const metaDescription =
    data.metaDescription?.trim() ||
    data.description?.trim() ||
    headline;
  const pageTitle =
    data.metaTitle?.trim() || `${headline} | ${titleSuffix}`;
  const ogTitle = data.ogTitle?.trim() || pageTitle;
  const ogDescription =
    data.ogDescription?.trim() || metaDescription;

  const imagePath =
    data.ogImage?.trim() || data.heroImage?.trim() || "";
  const ogImageAbsolute =
    imagePath !== "" ? new URL(imagePath, baseHref).href : defaultOgImage;

  const published = data.date.toISOString();
  const modified = (data.modifiedDate ?? data.date).toISOString();

  return {
    pageTitle,
    metaDescription,
    ogUrl: pageUrl,
    ogImageAbsolute,
    ogTitle,
    ogDescription,
    datePublished: published,
    dateModified: modified,
  };
}

export function blogPostingJsonLd(
  seo: BlogSeoResolved,
  extras?: {
    headline?: string;
    articleSection?: string;
    keywords?: string;
  },
): Record<string, unknown> {
  const headline =
    extras?.headline?.trim() ||
    seo.pageTitle.replace(/\s*\|\s*Field Notes.*$/i, "").trim();
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description: seo.metaDescription,
    image: seo.ogImageAbsolute,
    datePublished: seo.datePublished,
    dateModified: seo.dateModified,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
      "@id": ENTITY_IDS.person,
      url: new URL(ABOUT_PATH, seo.ogUrl).href,
    },
    publisher: { "@id": ENTITY_IDS.tidesOrg },
    url: seo.ogUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": seo.ogUrl,
    },
    ...(extras?.articleSection
      ? { articleSection: extras.articleSection }
      : {}),
    ...(extras?.keywords ? { keywords: extras.keywords } : {}),
  };
}
