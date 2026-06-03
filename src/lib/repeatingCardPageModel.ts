import type { CollectionEntry } from "astro:content";
import { render } from "astro:content";
import {
  buildScopedSectionNav,
  normalizeRepeatingCardArticleHtml,
  prefixHeadingIdsInHtml,
} from "./rcmHeadingIds";
import {
  isRepeatingMeaningReady,
  repeatingCardDisplayTitle,
  repeatingCardPanelDomId,
  repeatingCardPanelSummary,
  repeatingCardSlugFromId,
} from "./repeatingCardMeanings";
import { tarotCardImagePath } from "./tarotCardImage";

export type RepeatingCardSectionNavItem = { slug: string; text: string };

export type RepeatingCardPageModel = {
  entry: CollectionEntry<"repeatingCardMeanings">;
  cardSlug: string;
  displayTitle: string;
  panelDomId: string;
  panelSummary: string | null;
  imageSrc: string;
  imageAlt: string;
  articleHtml: string | null;
  sectionNav: RepeatingCardSectionNavItem[];
};

function fallbackLabelFromId(collectionId: string): string {
  return repeatingCardSlugFromId(collectionId)
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** Shared body pipeline for tool deep-links and canonical entity pages. */
export async function buildRepeatingCardPageModel(
  entry: CollectionEntry<"repeatingCardMeanings">,
): Promise<RepeatingCardPageModel | null> {
  if (!isRepeatingMeaningReady(entry)) return null;

  const cardSlug = repeatingCardSlugFromId(entry.id);
  const fallbackLabel = fallbackLabelFromId(entry.id);
  const displayTitle = repeatingCardDisplayTitle(entry, fallbackLabel);
  const panelDomId = repeatingCardPanelDomId(entry.id);
  const panelSummary = repeatingCardPanelSummary(entry);
  const imageSrc = tarotCardImagePath(cardSlug);
  const imageAlt = `${displayTitle} tarot card`;

  const { headings } = await render(entry);
  const rawHtml = entry.rendered?.html ?? "";
  const articleHtml = rawHtml
    ? normalizeRepeatingCardArticleHtml(
        prefixHeadingIdsInHtml(rawHtml, panelDomId),
        displayTitle,
        entry.data.title,
      )
    : null;
  const sectionNav = articleHtml ? buildScopedSectionNav(headings, panelDomId) : [];

  return {
    entry,
    cardSlug,
    displayTitle,
    panelDomId,
    panelSummary,
    imageSrc,
    imageAlt,
    articleHtml,
    sectionNav,
  };
}
