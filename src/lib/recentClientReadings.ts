import type { CollectionEntry } from "astro:content";
import { breadcrumbJsonLd, type BreadcrumbItem } from "./breadcrumbs";
import { ENTITY_IDS } from "./ecosystem-structured-data";
import {
  ASK_LEILIA_READINGS,
  askLeiliaAuthorPersonNode,
} from "../data/askLeilia";
import type { KnowledgeGraphExplore } from "./knowledgeGraph";
import { plainTextFromReadingMarkdown } from "./recentClientReadingContent";

export const RECENT_CLIENT_READINGS_HUB_PATH = "/recent-client-readings/";

export type RecentClientReadingEntry = CollectionEntry<"recentClientReadings">;

export function getRecentClientReadingPath(slug: string): string {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  return `${RECENT_CLIENT_READINGS_HUB_PATH}${normalized}/`;
}

export function isPublishedReading(entry: RecentClientReadingEntry): boolean {
  return entry.data.publicationStatus === "published";
}

export function getPublishedReadings(
  entries: RecentClientReadingEntry[],
): RecentClientReadingEntry[] {
  return entries
    .filter(isPublishedReading)
    .sort(
      (a, b) =>
        b.data.datePublished.getTime() - a.data.datePublished.getTime(),
    );
}

export function getFeaturedReadings(
  entries: RecentClientReadingEntry[],
): RecentClientReadingEntry[] {
  return getPublishedReadings(entries).filter((entry) => entry.data.featured);
}

export function getReadingMetaTitle(entry: RecentClientReadingEntry): string {
  return `${entry.data.title} | Reading Library | Ask Leilia | Tides of Knowing`;
}

export function getReadingCanonicalUrl(
  entry: RecentClientReadingEntry,
  siteOrigin: string,
): string {
  return new URL(getRecentClientReadingPath(entry.data.slug), siteOrigin).href;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function readingKeywords(entry: RecentClientReadingEntry): string[] {
  return [
    ...entry.data.tags,
    ...entry.data.lifeAreas,
    ...entry.data.archetypalThemes,
    entry.data.readingType,
    entry.data.dominantSuit,
    ...(entry.data.oracleDeck ? [entry.data.oracleDeck] : []),
    ...entry.data.oracleCards,
    ...entry.data.oracleThemes,
  ];
}

export function getLibraryBreadcrumbs(): BreadcrumbItem[] {
  return [
    { label: "Home", url: "/" },
    { label: "Ask Leilia", url: "/ask-leilia/" },
    { label: "Reading Library", url: null },
  ];
}

export function getReadingBreadcrumbs(entry: RecentClientReadingEntry): BreadcrumbItem[] {
  return [
    { label: "Home", url: "/" },
    { label: "Ask Leilia", url: "/ask-leilia/" },
    { label: "Reading Library", url: RECENT_CLIENT_READINGS_HUB_PATH },
    { label: entry.data.title, url: null },
  ];
}

function thingNodes(values: string[]): Record<string, unknown>[] {
  return values.map((name) => ({ "@type": "Thing", name }));
}

export function getLibraryJsonLd(
  entries: RecentClientReadingEntry[],
  siteOrigin: string,
): Record<string, unknown>[] {
  const canonical = new URL(RECENT_CLIENT_READINGS_HUB_PATH, siteOrigin).href;
  const description =
    "Browse anonymised client tarot readings by Leilia – Tides of Knowing: professionally written, personally interpreted examples that show question, spread and depth before you book.";

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#collection`,
    name: "Reading Library",
    description,
    url: canonical,
    inLanguage: "en",
    author: askLeiliaAuthorPersonNode(),
    publisher: { "@id": ENTITY_IDS.tidesOrg },
    about: thingNodes(["Tarot reading", "Symbolic interpretation", "Client readings"]),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.data.title,
        url: getReadingCanonicalUrl(entry, siteOrigin),
      })),
    },
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    name: "Reading Library | Ask Leilia | Tides of Knowing",
    description,
    url: canonical,
    isPartOf: { "@id": ENTITY_IDS.tidesWebSite },
    about: { "@id": `${canonical}#collection` },
    author: askLeiliaAuthorPersonNode(),
  };

  return [
    collectionPage,
    webPage,
    breadcrumbJsonLd(getLibraryBreadcrumbs(), siteOrigin),
  ];
}

export function getReadingJsonLd(
  entry: RecentClientReadingEntry,
  siteOrigin: string,
  explore?: KnowledgeGraphExplore,
): Record<string, unknown>[] {
  const canonical = getReadingCanonicalUrl(entry, siteOrigin);
  const modified = entry.data.dateModified ?? entry.data.datePublished;
  const keywords = readingKeywords(entry);
  const body = entry.body ?? "";
  const about = thingNodes([
    ...entry.data.lifeAreas,
    ...entry.data.archetypalThemes,
    ...entry.data.oracleThemes,
    entry.data.dominantSuit,
    ...(entry.data.oracleDeck ? [entry.data.oracleDeck] : []),
  ]);

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonical}#reading`,
    name: entry.data.title,
    description: entry.data.seoDescription,
    headline: entry.data.title,
    abstract: entry.data.summary,
    articleBody: plainTextFromReadingMarkdown(body),
    inLanguage: "en",
    datePublished: formatIsoDate(entry.data.datePublished),
    dateModified: formatIsoDate(modified),
    url: canonical,
    mainEntityOfPage: { "@id": `${canonical}#webpage` },
    author: askLeiliaAuthorPersonNode(),
    keywords: keywords.join(", "),
    about,
    mentions: thingNodes([
      ...entry.data.cardsFeatured,
      ...entry.data.oracleCards,
      ...(explore?.sections.flatMap((section) =>
        section.links.map((link) => link.title),
      ) ?? []),
    ]),
    genre: entry.data.readingType,
    learningResourceType: "Anonymised client tarot reading",
  };

  const associatedMedia: Record<string, unknown>[] = [];

  if (entry.data.pdfDownload?.trim()) {
    associatedMedia.push({
      "@type": "MediaObject",
      contentUrl: new URL(entry.data.pdfDownload, siteOrigin).href,
      encodingFormat: "application/pdf",
      name: `${entry.data.title} (complete PDF)`,
    });
  }

  for (const [index, imagePath] of entry.data.spreadImages.entries()) {
    associatedMedia.push({
      "@type": "ImageObject",
      contentUrl: new URL(imagePath, siteOrigin).href,
      name:
        index === 0
          ? `${entry.data.title} (featured spread photograph)`
          : `${entry.data.title} (spread photograph ${index + 1})`,
      encodingFormat: "image/jpeg",
    });
  }

  if (associatedMedia.length === 1) {
    article.associatedMedia = associatedMedia[0];
  } else if (associatedMedia.length > 1) {
    article.associatedMedia = associatedMedia;
  }

  const featuredSpread = entry.data.spreadImages[0];
  if (featuredSpread?.trim()) {
    article.image = new URL(featuredSpread, siteOrigin).href;
  }

  const graph: Record<string, unknown>[] = [
    article,
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      name: getReadingMetaTitle(entry),
      description: entry.data.seoDescription,
      url: canonical,
      isPartOf: { "@id": ENTITY_IDS.tidesWebSite },
      mainEntity: { "@id": `${canonical}#reading` },
    },
    breadcrumbJsonLd(getReadingBreadcrumbs(entry), siteOrigin),
  ];

  const matchingOffer = ASK_LEILIA_READINGS.find(
    (reading) => reading.libraryTypeLabel === entry.data.readingType,
  );
  if (matchingOffer) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Ask Leilia",
      url: new URL("/ask-leilia/", siteOrigin).href,
      provider: askLeiliaAuthorPersonNode(),
      offers: {
        "@type": "Offer",
        name: matchingOffer.name,
        price: matchingOffer.price.replace(/[^\d.]/g, ""),
        priceCurrency: "USD",
        url: new URL("/ask-leilia/", siteOrigin).href,
      },
    });
  }

  return graph;
}

export function resolveRelatedReadingEntries(
  entry: RecentClientReadingEntry,
  all: RecentClientReadingEntry[],
): RecentClientReadingEntry[] {
  const bySlug = new Map(
    getPublishedReadings(all).map((item) => [item.data.slug, item]),
  );
  return entry.data.relatedReadings
    .map((slug) => bySlug.get(slug))
    .filter((item): item is RecentClientReadingEntry => Boolean(item));
}
