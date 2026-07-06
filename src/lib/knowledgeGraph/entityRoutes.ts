import { slugify } from "../../utils/slugify";
import {
  fieldNoteSlugFromEntry,
  filterPublished,
  findSeriesFieldNote,
  findStandaloneFieldNote,
  seriesFieldNotePath,
  seriesSlugFromEntry,
  standaloneFieldNotePath,
  standaloneSlugFromEntry,
  type BlogEntry,
} from "../blogFieldNotes";
import {
  getRecentClientReadingPath,
  RECENT_CLIENT_READINGS_HUB_PATH,
  type RecentClientReadingEntry,
} from "../recentClientReadings";
import {
  isRepeatingMeaningReady,
  repeatingCardDisplayTitle,
  repeatingCardPanelSummary,
  repeatingCardSlugFromId,
  type RepeatingCardSuitFolder,
} from "../repeatingCardMeanings";
import { trimMetaDescription } from "../repeatingCardSeo";
import {
  getRepeatingCardCanonicalPath,
  getRepeatingCardSeoHubPath,
} from "../repeatingCardUrls";
import { SUIT_FOLDER_TO_LABEL } from "./taxonomy";
import type { CollectionEntry } from "astro:content";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

/**
 * Flip to `true` when numerology entity pages ship.
 * Until then, numerology refs are indexed but not linked on public pages.
 */
export const NUMEROLOGY_ENTITY_PAGES_PUBLISHED = false;

const NUMEROLOGY_HUB_PATH = "/tarot/numerology/";

export function getNumerologyEntityPath(number: string): string | null {
  if (!NUMEROLOGY_ENTITY_PAGES_PUBLISHED) return null;
  return `${NUMEROLOGY_HUB_PATH}${number}/`;
}

export function getSuitEntityPath(folder: RepeatingCardSuitFolder): string {
  return `${getRepeatingCardSeoHubPath()}#rcm-hub-suit-${folder}`;
}

export function getSpreadEntityPath(spread: string): string {
  return `${RECENT_CLIENT_READINGS_HUB_PATH}?spread=${encodeURIComponent(slugify(spread))}`;
}

export function getTarotCardEntityPath(
  entry: RepeatingCardEntry,
): string {
  return getRepeatingCardCanonicalPath(entry);
}

export function getFieldNoteEntityPath(entry: BlogEntry): string {
  const seriesSlug = seriesSlugFromEntry(entry);
  if (seriesSlug) {
    return seriesFieldNotePath(seriesSlug, fieldNoteSlugFromEntry(entry));
  }
  return standaloneFieldNotePath(standaloneSlugFromEntry(entry));
}

export function getClientReadingEntityPath(entry: RecentClientReadingEntry): string {
  return getRecentClientReadingPath(entry.data.slug);
}

function fallbackCardTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function buildTarotCardLink(
  entry: RepeatingCardEntry,
): { title: string; description: string | null; href: string; ref: string } {
  const ref = repeatingCardSlugFromId(entry.id);
  const title = repeatingCardDisplayTitle(entry, fallbackCardTitle(ref));
  const summaryRaw = repeatingCardPanelSummary(entry);
  const description = summaryRaw ? trimMetaDescription(summaryRaw, 140) : null;
  return {
    ref,
    title,
    description,
    href: getTarotCardEntityPath(entry),
  };
}

export function buildSuitLink(
  folder: RepeatingCardSuitFolder,
): { title: string; description: string | null; href: string; ref: string } {
  return {
    ref: folder,
    title: SUIT_FOLDER_TO_LABEL[folder],
    description: `Repeating card meanings for the ${SUIT_FOLDER_TO_LABEL[folder]} suit.`,
    href: getSuitEntityPath(folder),
  };
}

export function buildNumerologyLink(
  number: string,
): { title: string; description: string | null; href: string; ref: string } | null {
  const href = getNumerologyEntityPath(number);
  if (!href) return null;
  return {
    ref: number,
    title: `Tarot Number ${number}`,
    description: `Numerological themes associated with ${number} in tarot symbolism.`,
    href,
  };
}

export function buildSpreadLink(
  spread: string,
): { title: string; description: string | null; href: string; ref: string } {
  return {
    ref: spread,
    title: spread,
    description: `Client readings prepared using the ${spread} spread.`,
    href: getSpreadEntityPath(spread),
  };
}

export function buildFieldNoteLink(
  entry: BlogEntry,
): { title: string; description: string | null; href: string; ref: string } {
  const seriesSlug = seriesSlugFromEntry(entry);
  const ref = seriesSlug
    ? `${seriesSlug}/${fieldNoteSlugFromEntry(entry)}`
    : standaloneSlugFromEntry(entry);

  return {
    ref,
    title: entry.data.title,
    description: entry.data.description?.trim()
      ? trimMetaDescription(entry.data.description, 140)
      : null,
    href: getFieldNoteEntityPath(entry),
  };
}

export function buildClientReadingLink(
  entry: RecentClientReadingEntry,
): { title: string; description: string | null; href: string; ref: string } {
  return {
    ref: entry.data.slug,
    title: entry.data.title,
    description: trimMetaDescription(entry.data.summary, 140),
    href: getClientReadingEntityPath(entry),
  };
}

export function resolveFieldNoteByRef(
  ref: string,
  blogEntries: BlogEntry[],
): BlogEntry | undefined {
  const normalized = ref.replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");
  const published = filterPublished(blogEntries);

  if (normalized.includes("/")) {
    const [seriesSlug, noteSlug] = normalized.split("/", 2);
    if (seriesSlug && noteSlug) {
      return findSeriesFieldNote(published, seriesSlug, noteSlug);
    }
  }

  return findStandaloneFieldNote(published, normalized);
}

export function isRoutableTarotCard(
  entry: RepeatingCardEntry | undefined,
): entry is RepeatingCardEntry {
  return Boolean(entry && isRepeatingMeaningReady(entry));
}
