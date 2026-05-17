import type { CollectionEntry } from "astro:content";
import { AUTHOR_NAME } from "./blogSeo";
import type { BreadcrumbItem } from "./breadcrumbs";
import { breadcrumbJsonLd } from "./breadcrumbs";
import { ENTITY_IDS } from "./ecosystem-structured-data";
import {
  repeatingCardDisplayTitle,
  repeatingCardPanelSummary,
  repeatingCardSlugFromId,
} from "./repeatingCardMeanings";
import { tarotCardImagePath } from "./tarotCardImage";
import {
  getRepeatingCardCanonicalUrl,
  getRepeatingCardHubPath,
  getRepeatingCardSuitPath,
  repeatingCardSuitFromId,
} from "./repeatingCardUrls";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

const META_DESCRIPTION_MAX = 160;
const TITLE_SUFFIX = "Tarot Pattern Interpretation";
const DEFINED_TERM_SET = "Repeating Card Meanings";

const SUIT_LABELS: Record<string, string> = {
  majors: "Major Arcana",
  cups: "Cups",
  swords: "Swords",
  wands: "Wands",
  pentacles: "Pentacles",
};

function suitLabelForId(collectionId: string): string {
  const suit = repeatingCardSuitFromId(collectionId);
  return SUIT_LABELS[suit] ?? suit;
}

function cardHeadline(entry: RepeatingCardEntry): string {
  const fallback = repeatingCardSlugFromId(entry.id)
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
  return repeatingCardDisplayTitle(entry, fallback);
}

export function trimMetaDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > max * 0.6) return `${slice.slice(0, lastSpace)}…`;
  return `${slice}…`;
}

export function getRepeatingCardMetaTitle(entry: RepeatingCardEntry): string {
  const custom = entry.data.metaTitle?.trim();
  if (custom) return custom;
  return `Repeating ${cardHeadline(entry)} Meaning | ${TITLE_SUFFIX}`;
}

export function getRepeatingCardMetaDescription(entry: RepeatingCardEntry): string {
  const custom = entry.data.metaDescription?.trim();
  if (custom) return trimMetaDescription(custom);
  const summary = repeatingCardPanelSummary(entry);
  if (summary) return trimMetaDescription(summary);
  return trimMetaDescription(
    `What it means when ${cardHeadline(entry)} keeps appearing in your tarot readings, and how to integrate the repeating pattern.`,
  );
}

export function getRepeatingCardBreadcrumbs(entry: RepeatingCardEntry): BreadcrumbItem[] {
  const suit = repeatingCardSuitFromId(entry.id);
  const headline = cardHeadline(entry);
  return [
    { label: "Home", url: "/" },
    { label: "Tools", url: "/tools/" },
    { label: "Repeating Card Meanings", url: getRepeatingCardHubPath() },
    { label: suitLabelForId(entry.id), url: getRepeatingCardSuitPath(suit) },
    { label: headline, url: null },
  ];
}

function repeatingCardArticleJsonLd(
  entry: RepeatingCardEntry,
  canonical: string,
  baseHref: string,
): Record<string, unknown> {
  const headline = cardHeadline(entry);
  const description = getRepeatingCardMetaDescription(entry);
  const imagePath = tarotCardImagePath(repeatingCardSlugFromId(entry.id));
  const image = new URL(imagePath, baseHref).href;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
      "@id": ENTITY_IDS.person,
    },
    publisher: {
      "@type": "Organization",
      name: "Tides of Knowing",
      "@id": ENTITY_IDS.tidesOrg,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    url: canonical,
    image,
  };
}

function repeatingCardDefinedTermJsonLd(
  entry: RepeatingCardEntry,
): Record<string, unknown> {
  const name = cardHeadline(entry);
  const description = getRepeatingCardMetaDescription(entry);

  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name,
    description,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: DEFINED_TERM_SET,
    },
  };
}

/** Article, BreadcrumbList, and DefinedTerm JSON-LD for a card page. */
export function getRepeatingCardJsonLd(
  entry: RepeatingCardEntry,
  siteHref: string,
): Record<string, unknown>[] {
  const canonical = getRepeatingCardCanonicalUrl(entry, siteHref);
  const crumbs = getRepeatingCardBreadcrumbs(entry);

  return [
    repeatingCardArticleJsonLd(entry, canonical, siteHref),
    breadcrumbJsonLd(crumbs, siteHref),
    repeatingCardDefinedTermJsonLd(entry),
  ];
}

/** Absolute OG image for a card entry. */
export function getRepeatingCardOgImage(entry: RepeatingCardEntry, baseHref: string): string {
  const imagePath = tarotCardImagePath(repeatingCardSlugFromId(entry.id));
  return new URL(imagePath, baseHref).href;
}
