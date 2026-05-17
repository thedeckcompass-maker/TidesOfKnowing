import type { CollectionEntry } from "astro:content";
import { TIDES_OF_KNOWING_ORIGIN } from "./ecosystem-structured-data";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

export function getRepeatingCardHubPath(): string {
  return "/tools/repeating-card-meanings/";
}

/** Suit segment from a collection id (`cups/ace-of-cups` → `cups`). */
export function repeatingCardSuitFromId(collectionId: string): string {
  return collectionId.split("/")[0] ?? collectionId;
}

function normalizeCollectionId(idOrEntry: string | RepeatingCardEntry): string {
  const raw = typeof idOrEntry === "string" ? idOrEntry : idOrEntry.id;
  return raw.replace(/^\/+|\/+$/g, "");
}

export function getRepeatingCardPath(idOrEntry: string | RepeatingCardEntry): string {
  const id = normalizeCollectionId(idOrEntry);
  return `/tools/repeating-card-meanings/${id}/`;
}

/**
 * Suit-level path (no dedicated suit index route yet).
 * Returns the tool hub until suit landing pages exist.
 */
export function getRepeatingCardSuitPath(_suit: string): string {
  return getRepeatingCardHubPath();
}

export function getRepeatingCardCanonicalUrl(
  idOrEntry: string | RepeatingCardEntry,
  siteOrigin: string = TIDES_OF_KNOWING_ORIGIN,
): string {
  const path = getRepeatingCardPath(idOrEntry);
  return new URL(path, siteOrigin.replace(/\/$/, "")).href;
}
