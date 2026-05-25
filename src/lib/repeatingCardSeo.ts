import type { CollectionEntry } from "astro:content";
import type { BreadcrumbItem } from "./breadcrumbs";
import { breadcrumbJsonLd } from "./breadcrumbs";
import {
  repeatingCardDisplayTitle,
  repeatingCardPanelSummary,
  repeatingCardSlugFromId,
} from "./repeatingCardMeanings";
import { tarotCardImagePath } from "./tarotCardImage";
import {
  getRepeatingCardCanonicalPath,
  getRepeatingCardCanonicalUrl,
  getRepeatingCardHubPath,
  getRepeatingCardSeoHubPath,
  getRepeatingCardSuitPath,
  repeatingCardSuitFromId,
} from "./repeatingCardUrls";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

const META_DESCRIPTION_MAX = 160;
const TITLE_SUFFIX = "Tarot Pattern Interpretation";
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

export function cardHeadline(entry: RepeatingCardEntry): string {
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
  const suitLabel = suitLabelForId(entry.id);
  const headline = cardHeadline(entry);
  if (summary) {
    const withSuit =
      summary.length <= META_DESCRIPTION_MAX - suitLabel.length - 4
        ? `${summary} (${suitLabel})`
        : summary;
    return trimMetaDescription(withSuit);
  }
  const keyword = entry.data.primaryKeyword?.trim();
  if (keyword) {
    return trimMetaDescription(
      `${keyword}: symbolic interpretation for ${headline} (${suitLabel}) when the card keeps returning in tarot readings.`,
    );
  }
  return trimMetaDescription(
    `When ${headline} (${suitLabel}) keeps appearing in tarot readings: what the repetition signals and how to work with the pattern.`,
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

/** Breadcrumbs for canonical `/repeating-card-meanings/{slug}/` entity pages. */
export function getRepeatingCardEntityBreadcrumbs(entry: RepeatingCardEntry): BreadcrumbItem[] {
  const headline = cardHeadline(entry);
  return [
    { label: "Home", url: "/" },
    { label: "Repeating Card Meanings", url: getRepeatingCardSeoHubPath() },
    { label: headline, url: null },
  ];
}

export function getRepeatingCardEntityBreadcrumbJsonLd(
  entry: RepeatingCardEntry,
  siteHref: string,
): Record<string, unknown> {
  const headline = cardHeadline(entry);
  const cardPath = getRepeatingCardCanonicalPath(entry);
  const items: BreadcrumbItem[] = [
    { label: "Home", url: "/" },
    { label: "Repeating Card Meanings", url: getRepeatingCardSeoHubPath() },
    { label: headline, url: cardPath },
  ];
  return breadcrumbJsonLd(items, siteHref);
}

/** Absolute OG image for a card entry. */
export function getRepeatingCardOgImage(entry: RepeatingCardEntry, baseHref: string): string {
  const imagePath = tarotCardImagePath(repeatingCardSlugFromId(entry.id));
  return new URL(imagePath, baseHref).href;
}
