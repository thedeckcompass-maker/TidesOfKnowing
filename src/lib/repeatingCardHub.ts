import type { CollectionEntry } from "astro:content";
import { AUTHOR_NAME } from "./blogSeo";
import type { BreadcrumbItem } from "./breadcrumbs";
import { breadcrumbJsonLd } from "./breadcrumbs";
import { ENTITY_IDS } from "./ecosystem-structured-data";
import {
  getRepeatingCardToolOptions,
  isRepeatingMeaningReady,
  repeatingCardDisplayTitle,
  repeatingCardPanelSummary,
  repeatingCardSlugFromId,
  REPEATING_CARD_SUIT_FOLDERS,
  type RepeatingCardSuitFolder,
} from "./repeatingCardMeanings";
import { trimMetaDescription } from "./repeatingCardSeo";
import { getRepeatingCardSeoHubPath, getRepeatingCardSeoPath } from "./repeatingCardUrls";

export const REPEATING_CARD_HUB_TITLE =
  "Repeating Card Meanings | Symbolic Tarot Pattern Library";

export const REPEATING_CARD_HUB_DESCRIPTION =
  "Canonical reference pages for when the same tarot card keeps appearing: 78 in-depth repeating-card meanings across Major Arcana and Minors, framed through symbolic interpretation and The COMPASS Method.";

const SUIT_HEADINGS: Record<RepeatingCardSuitFolder, string> = {
  majors: "Major Arcana",
  cups: "Cups",
  swords: "Swords",
  wands: "Wands",
  pentacles: "Pentacles",
};

export type RepeatingCardHubLink = {
  title: string;
  href: string;
  summary: string | null;
};

export type RepeatingCardHubSection = {
  suit: RepeatingCardSuitFolder;
  heading: string;
  cards: RepeatingCardHubLink[];
};

function fallbackLabelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function getRepeatingCardHubBreadcrumbs(): BreadcrumbItem[] {
  return [
    { label: "Home", url: "/" },
    { label: "Repeating Card Meanings", url: null },
  ];
}

/** Ready cards grouped by suit for the SEO hub index. */
export function buildRepeatingCardHubSections(
  entries: CollectionEntry<"repeatingCardMeanings">[],
): RepeatingCardHubSection[] {
  const ready = entries.filter(isRepeatingMeaningReady);

  return REPEATING_CARD_SUIT_FOLDERS.map((suit) => {
    const options = getRepeatingCardToolOptions(ready, suit);
    const byId = new Map(ready.map((entry) => [entry.id, entry]));

    const cards: RepeatingCardHubLink[] = options.map(({ id, label }) => {
      const entry = byId.get(id)!;
      const slug = repeatingCardSlugFromId(id);
      const title = repeatingCardDisplayTitle(entry, label || fallbackLabelFromSlug(slug));
      const summaryRaw = repeatingCardPanelSummary(entry);
      const summary = summaryRaw ? trimMetaDescription(summaryRaw, 140) : null;

      return {
        title,
        href: getRepeatingCardSeoPath(slug),
        summary,
      };
    });

    return {
      suit,
      heading: SUIT_HEADINGS[suit],
      cards,
    };
  }).filter((section) => section.cards.length > 0);
}

export function getRepeatingCardHubCanonicalUrl(siteHref: string): string {
  return new URL(getRepeatingCardSeoHubPath(), siteHref.replace(/\/$/, "")).href;
}

/** WebPage, BreadcrumbList, and ItemList in a single @graph document. */
export function getRepeatingCardHubJsonLd(
  sections: RepeatingCardHubSection[],
  siteHref: string,
): Record<string, unknown> {
  const canonical = getRepeatingCardHubCanonicalUrl(siteHref);
  const pageId = `${canonical}#webpage`;
  const itemListId = `${canonical}#card-list`;

  const flatCards = sections.flatMap((section) => section.cards);
  const crumbs = getRepeatingCardHubBreadcrumbs();
  const breadcrumbLd = breadcrumbJsonLd(crumbs, siteHref);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": pageId,
        name: REPEATING_CARD_HUB_TITLE,
        url: canonical,
        description: REPEATING_CARD_HUB_DESCRIPTION,
        inLanguage: "en-NZ",
        isPartOf: { "@id": ENTITY_IDS.tidesWebSite },
        publisher: { "@id": ENTITY_IDS.tidesOrg },
        author: {
          "@type": "Person",
          name: AUTHOR_NAME,
          "@id": ENTITY_IDS.person,
        },
        about: [
          { "@type": "Thing", name: "Repeating tarot card meanings" },
          { "@type": "Thing", name: "Symbolic tarot interpretation" },
        ],
        mentions: [{ "@id": ENTITY_IDS.compassMethod }],
        mainEntity: { "@id": itemListId },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbLd.itemListElement,
      },
      {
        "@type": "ItemList",
        "@id": itemListId,
        name: "Repeating Card Meanings",
        description: REPEATING_CARD_HUB_DESCRIPTION,
        numberOfItems: flatCards.length,
        itemListElement: flatCards.map((card, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: card.title,
          url: new URL(card.href, siteHref).href,
        })),
      },
    ],
  };
}
