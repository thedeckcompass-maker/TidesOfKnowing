import type { CollectionEntry } from "astro:content";

/** Suit folders synced with `repeatingCardMeanings` glob in `src/content.config.ts`. */
export const REPEATING_CARD_SUIT_FOLDERS = [
  "majors",
  "cups",
  "swords",
  "wands",
  "pentacles",
] as const;

export type RepeatingCardSuitFolder = (typeof REPEATING_CARD_SUIT_FOLDERS)[number];

export type RepeatingCardToolOption = {
  /** Collection entry id, e.g. `majors/the-fool`. */
  id: string;
  label: string;
};

export const REPEATING_MEANING_PREPARING_COPY =
  "This repeated meaning is still being prepared.";

/** DOM-safe id segment for panel anchors (`majors/the-fool` → `majors--the-fool`). */
export function repeatingCardPanelDomId(collectionId: string): string {
  return collectionId.replace(/\//g, "--");
}

function fallbackLabelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * Dropdown options from the content collection for a suit folder (default: majors).
 * Sorted by `card_number` when present, otherwise by slug.
 */
export function getRepeatingCardToolOptions(
  entries: CollectionEntry<"repeatingCardMeanings">[],
  suit: RepeatingCardSuitFolder = "majors",
): RepeatingCardToolOption[] {
  const prefix = `${suit}/`;

  return entries
    .filter((entry) => entry.id.startsWith(prefix))
    .sort((a, b) => {
      const numA = Number.parseInt(a.data.card_number, 10);
      const numB = Number.parseInt(b.data.card_number, 10);
      if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return repeatingCardSlugFromId(a.id).localeCompare(repeatingCardSlugFromId(b.id));
    })
    .map((entry) => ({
      id: entry.id,
      label: repeatingCardDisplayTitle(
        entry,
        fallbackLabelFromSlug(repeatingCardSlugFromId(entry.id)),
      ),
    }));
}

/** Tarot image slug from a collection id (`majors/the-fool` → `the-fool`). */
export function repeatingCardSlugFromId(collectionId: string): string {
  const segment = collectionId.split("/").pop();
  return segment?.trim() || collectionId;
}

export function getRepeatingCardEntry(
  byId: Map<string, CollectionEntry<"repeatingCardMeanings">>,
  collectionId: string,
): CollectionEntry<"repeatingCardMeanings"> | undefined {
  return (
    byId.get(collectionId) ??
    byId.get(repeatingCardSlugFromId(collectionId))
  );
}

const CORE_SECTION = "## Core Repeating Message";
const MIN_BODY_CHARS = 400;

export function isRepeatingMeaningReady(
  entry: CollectionEntry<"repeatingCardMeanings"> | undefined,
): boolean {
  if (!entry) return false;
  if (entry.data.ready === false) return false;
  if (entry.data.ready === true) return true;
  const body = entry.body?.trim() ?? "";
  return body.length >= MIN_BODY_CHARS && body.includes(CORE_SECTION);
}

/** Panel summary: frontmatter `summary`, else pull quote or first paragraph from body. */
export function repeatingCardPanelSummary(
  entry: CollectionEntry<"repeatingCardMeanings"> | undefined,
): string | null {
  const fromFrontmatter = entry?.data.summary?.trim();
  if (fromFrontmatter) return fromFrontmatter;
  return repeatingMeaningExcerpt(entry?.body ?? "");
}

/** Pull quote or first substantive paragraph (fallback when `summary` is absent). */
export function repeatingMeaningExcerpt(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const blockquote = trimmed.match(/^>\s+(.+)$/m);
  if (blockquote?.[1]) return blockquote[1].trim();

  const afterTitle = trimmed.replace(/^#\s+.+\n+/, "");
  const paragraph = afterTitle.match(/^(?!#|>|-|\*)\S[^\n]+/m);
  return paragraph?.[0]?.trim() ?? null;
}

export function repeatingCardDisplayTitle(
  entry: CollectionEntry<"repeatingCardMeanings"> | undefined,
  fallbackLabel: string,
): string {
  if (!entry?.data.title) return fallbackLabel;
  return entry.data.title.replace(/\s+Repeating Meaning$/i, "").trim() || fallbackLabel;
}
