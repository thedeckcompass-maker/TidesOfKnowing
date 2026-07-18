import { breadcrumbJsonLd, type BreadcrumbItem } from "../breadcrumbs";
import { ENTITY_IDS } from "../ecosystem-structured-data";
import { askLeiliaAuthorPersonNode } from "../../data/askLeilia";
import type { ReadingLibraryPublication } from "./types";

export const READING_LIBRARY_HUB_PATH = "/recent-client-readings/";

export type {
  ReadingLibraryPublication,
  ReadingLibraryAdminPublication,
  ReadingLibraryAdminDraft,
  AuthorisedSampleDraft,
  ReadingLibrarySourceType,
} from "./types";
export {
  READING_LIBRARY_SOURCE_TYPES,
  isReadingLibrarySourceType,
} from "./types";
export {
  getPublishedLibraryPublications,
  getPublishedLibraryPublicationBySlug,
  getLibraryPublicationByRequestId,
  getLibraryPublicationsByRequestIds,
  getAuthorisedSamplePublications,
  getAuthorisedSampleById,
  getAuthorisedSampleBySlug,
  resolveLibraryPdfSource,
  upsertLibraryPublication,
  upsertAuthorisedSample,
} from "./queries";
export {
  normalizeLibrarySlug,
  parseCommaSeparatedList,
  parseLineSeparatedList,
  parseConsentConfirmedAt,
  readingLibraryDraftFromForm,
  authorisedSampleDraftFromForm,
  validateReadingLibraryDraft,
  validateAuthorisedSampleDraft,
} from "./validation";
export {
  READING_LIBRARY_BUCKET,
  READING_LIBRARY_SAMPLE_PREFIX,
  readingLibrarySamplePathPrefix,
  safeSampleSlug,
  uploadAuthorisedSamplePdf,
  removeAuthorisedSamplePdfObject,
} from "./storage";

export function getReadingLibraryPath(slug: string): string {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  return `${READING_LIBRARY_HUB_PATH}${normalized}/`;
}

export function formatLibraryDate(date: Date): string {
  return date.toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatLibraryIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getFeaturedSpreadImage(
  publication: ReadingLibraryPublication,
): string | undefined {
  return publication.spreadImagePaths[0];
}

export function getGallerySpreadImages(publication: ReadingLibraryPublication): string[] {
  return publication.spreadImagePaths.slice(1);
}

export function getLibraryBreadcrumbs(): BreadcrumbItem[] {
  return [
    { label: "Home", url: "/" },
    { label: "Ask Leilia", url: "/ask-leilia/" },
    { label: "Reading Library", url: null },
  ];
}

export function getReadingBreadcrumbs(publication: ReadingLibraryPublication): BreadcrumbItem[] {
  return [
    { label: "Home", url: "/" },
    { label: "Ask Leilia", url: "/ask-leilia/" },
    { label: "Reading Library", url: READING_LIBRARY_HUB_PATH },
    { label: publication.title, url: null },
  ];
}

export function getReadingMetaTitle(publication: ReadingLibraryPublication): string {
  return `${publication.title} | Reading Library | Ask Leilia | Tides of Knowing`;
}

export function getReadingCanonicalUrl(publication: ReadingLibraryPublication, siteOrigin: string): string {
  return new URL(getReadingLibraryPath(publication.slug), siteOrigin).href;
}

const LIBRARY_DESCRIPTION =
  "Explore genuine client tarot readings shared with permission and carefully anonymised — professionally written and personally interpreted by Leilia.";

export function getLibraryJsonLd(
  publications: ReadingLibraryPublication[],
  siteOrigin: string,
): Record<string, unknown>[] {
  const canonical = new URL(READING_LIBRARY_HUB_PATH, siteOrigin).href;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#collection`,
    name: "Reading Library",
    description: LIBRARY_DESCRIPTION,
    url: canonical,
    inLanguage: "en",
    author: askLeiliaAuthorPersonNode(),
    publisher: { "@id": ENTITY_IDS.tidesOrg },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: publications.length,
      itemListElement: publications.map((publication, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: publication.title,
        url: getReadingCanonicalUrl(publication, siteOrigin),
      })),
    },
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    name: "Reading Library | Ask Leilia | Tides of Knowing",
    description: LIBRARY_DESCRIPTION,
    url: canonical,
    isPartOf: { "@id": ENTITY_IDS.tidesWebSite },
    about: { "@id": `${canonical}#collection` },
    author: askLeiliaAuthorPersonNode(),
  };

  return [collectionPage, webPage, breadcrumbJsonLd(getLibraryBreadcrumbs(), siteOrigin)];
}

function plainTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getReadingJsonLd(
  publication: ReadingLibraryPublication,
  siteOrigin: string,
): Record<string, unknown>[] {
  const canonical = getReadingCanonicalUrl(publication, siteOrigin);
  const publishedAt = publication.publishedAt ?? publication.updatedAt;

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonical}#reading`,
    name: publication.title,
    description: publication.seoDescription,
    headline: publication.title,
    abstract: publication.summary,
    articleBody: plainTextFromMarkdown(publication.body),
    inLanguage: "en",
    datePublished: formatLibraryIsoDate(publishedAt),
    dateModified: formatLibraryIsoDate(publication.updatedAt),
    url: canonical,
    mainEntityOfPage: { "@id": `${canonical}#webpage` },
    author: askLeiliaAuthorPersonNode(),
    keywords: [
      ...publication.lifeAreas,
      ...publication.primaryCards,
      publication.readingType,
    ].join(", "),
    about: publication.lifeAreas.map((name) => ({ "@type": "Thing", name })),
    mentions: publication.primaryCards.map((name) => ({ "@type": "Thing", name })),
    genre: publication.readingType,
    learningResourceType: "Anonymised client tarot reading",
  };

  const featuredSpread = publication.spreadImagePaths[0];
  if (featuredSpread?.trim()) {
    article.image = new URL(featuredSpread, siteOrigin).href;
  }

  return [
    article,
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      name: getReadingMetaTitle(publication),
      description: publication.seoDescription,
      url: canonical,
      isPartOf: { "@id": ENTITY_IDS.tidesWebSite },
      mainEntity: { "@id": `${canonical}#reading` },
    },
    breadcrumbJsonLd(getReadingBreadcrumbs(publication), siteOrigin),
  ];
}
