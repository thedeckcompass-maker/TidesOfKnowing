import type { CollectionEntry } from "astro:content";
import { repeatingCardSlugFromId } from "./repeatingCardMeanings";
import { TIDES_OF_KNOWING_ORIGIN } from "./ecosystem-structured-data";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

const ENTITY_ID_FRAGMENT = "repeating-card-meaning";

/** Interactive tool hub (dropdown UI). */
export function getRepeatingCardHubPath(): string {
  return "/tools/repeating-card-meanings/";
}

/** SEO/AEO cluster hub (framework page; route may follow). */
export function getRepeatingCardSeoHubPath(): string {
  return "/repeating-card-meanings/";
}

/** Indexable entity page path: `/repeating-card-meanings/{card-slug}/`. */
export function getRepeatingCardSeoPath(cardSlug: string): string {
  const slug = cardSlug.replace(/^\/+|\/+$/g, "");
  return `/repeating-card-meanings/${slug}/`;
}

/** Suit segment from a collection id (`cups/ace-of-cups` → `cups`). */
export function repeatingCardSuitFromId(collectionId: string): string {
  return collectionId.split("/")[0] ?? collectionId;
}

function normalizeCollectionId(idOrEntry: string | RepeatingCardEntry): string {
  const raw = typeof idOrEntry === "string" ? idOrEntry : idOrEntry.id;
  return raw.replace(/^\/+|\/+$/g, "");
}

function normalizeCardSlug(cardSlugOrEntry: string | RepeatingCardEntry): string {
  if (typeof cardSlugOrEntry === "string") {
    const segment = cardSlugOrEntry.replace(/^\/+|\/+$/g, "");
    return segment.includes("/")
      ? (segment.split("/").pop() ?? segment)
      : segment;
  }
  return repeatingCardSlugFromId(cardSlugOrEntry.id);
}

export function getRepeatingCardPath(idOrEntry: string | RepeatingCardEntry): string {
  const id = normalizeCollectionId(idOrEntry);
  return `/tools/repeating-card-meanings/${id}/`;
}

/**
 * Absolute URL for the interactive tool deep-link (`/tools/repeating-card-meanings/{id}/`).
 */
export function getRepeatingCardToolUrl(
  idOrEntry: string | RepeatingCardEntry,
  siteOrigin: string = TIDES_OF_KNOWING_ORIGIN,
): string {
  const path = getRepeatingCardPath(idOrEntry);
  return new URL(path, siteOrigin.replace(/\/$/, "")).href;
}

/**
 * Suit-level path (no dedicated suit index route yet).
 * Returns the tool hub until suit landing pages exist.
 */
export function getRepeatingCardSuitPath(_suit: string): string {
  return getRepeatingCardHubPath();
}

function resolveCanonicalPath(entry: RepeatingCardEntry): string {
  const override = entry.data.canonicalUrl?.trim();
  if (override) {
    const normalized = override.startsWith("/") ? override : `/${override}`;
    return normalized.endsWith("/") ? normalized : `${normalized}/`;
  }
  return getRepeatingCardSeoPath(repeatingCardSlugFromId(entry.id));
}

/**
 * Path-only canonical for a card entity page (`/repeating-card-meanings/{slug}/`).
 */
export function getRepeatingCardCanonicalPath(
  cardSlugOrEntry: string | RepeatingCardEntry,
): string {
  if (typeof cardSlugOrEntry === "string") {
    return getRepeatingCardSeoPath(cardSlugOrEntry);
  }
  return resolveCanonicalPath(cardSlugOrEntry);
}

/**
 * Absolute canonical URL for indexable entity pages.
 * https://www.tidesofknowing.com/repeating-card-meanings/{slug}/
 */
export function getRepeatingCardCanonicalUrl(
  cardSlugOrEntry: string | RepeatingCardEntry,
  siteOrigin: string = TIDES_OF_KNOWING_ORIGIN,
): string {
  const path = getRepeatingCardCanonicalPath(cardSlugOrEntry);
  return new URL(path, siteOrigin.replace(/\/$/, "")).href;
}

/**
 * Stable schema.org @id for a repeating card entity (fragment on the canonical page).
 */
export function getRepeatingCardEntityId(
  cardSlugOrEntry: string | RepeatingCardEntry,
  siteOrigin: string = TIDES_OF_KNOWING_ORIGIN,
): string {
  return `${getRepeatingCardCanonicalUrl(cardSlugOrEntry, siteOrigin)}#${ENTITY_ID_FRAGMENT}`;
}

/** @deprecated Use getRepeatingCardCanonicalUrl for SEO canonicals. */
export function getRepeatingCardSeoCanonicalPath(
  cardSlugOrEntry: string | RepeatingCardEntry,
): string {
  return getRepeatingCardCanonicalPath(cardSlugOrEntry);
}

/** @deprecated Use getRepeatingCardCanonicalUrl for SEO canonicals. */
export function getRepeatingCardSeoCanonicalUrl(
  cardSlugOrEntry: string | RepeatingCardEntry,
  siteOrigin: string = TIDES_OF_KNOWING_ORIGIN,
): string {
  return getRepeatingCardCanonicalUrl(cardSlugOrEntry, siteOrigin);
}

/** @deprecated Use getRepeatingCardCanonicalPath. */
export function getRepeatingCardResolvedCanonicalPath(entry: RepeatingCardEntry): string {
  return getRepeatingCardCanonicalPath(entry);
}

/** @deprecated Use getRepeatingCardCanonicalUrl. */
export function getRepeatingCardResolvedCanonicalUrl(
  entry: RepeatingCardEntry,
  siteOrigin: string = TIDES_OF_KNOWING_ORIGIN,
): string {
  return getRepeatingCardCanonicalUrl(entry, siteOrigin);
}
