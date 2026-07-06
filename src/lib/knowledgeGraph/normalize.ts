import { slugify } from "../../utils/slugify";
import { repeatingCardSlugFromId } from "../repeatingCardMeanings";
import { RECENT_CLIENT_SPREADS } from "../recentClientReadingsTaxonomy";
import { DOMINANT_SUIT_TO_FOLDER, SUIT_FOLDER_TO_LABEL } from "./taxonomy";
import type { RepeatingCardSuitFolder } from "../repeatingCardMeanings";

const WORD_TO_NUMBER: Record<string, string> = {
  ace: "1",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  page: "11",
  knight: "12",
  queen: "13",
  king: "14",
};

/** Lowercase comparison key for card titles and refs. */
export function normalizeGraphKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+repeating meaning$/i, "")
    .replace(/[^\w\s/-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Card ref → URL slug (`Two of Cups`, `cups/two-of-cups` → `two-of-cups`). */
export function normalizeCardRef(ref: string): string {
  const trimmed = ref.trim();
  if (!trimmed) return "";
  if (trimmed.includes("/")) {
    return repeatingCardSlugFromId(trimmed.replace(/^\/+|\/+$/g, ""));
  }
  return slugify(trimmed);
}

/** Field note ref → stable lookup key (`series-slug/note-slug` or standalone slug). */
export function normalizeFieldNoteRef(ref: string): string {
  return ref.trim().replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");
}

/** Suit ref → repeating-card suit folder when recognized. */
export function normalizeSuitFolder(ref: string): RepeatingCardSuitFolder | null {
  const key = normalizeGraphKey(ref);
  if (!key) return null;

  const folderCandidates: RepeatingCardSuitFolder[] = [
    "majors",
    "cups",
    "swords",
    "wands",
    "pentacles",
  ];
  if (folderCandidates.includes(key as RepeatingCardSuitFolder)) {
    return key as RepeatingCardSuitFolder;
  }

  for (const [label, folder] of Object.entries(DOMINANT_SUIT_TO_FOLDER)) {
    if (normalizeGraphKey(label) === key) return folder;
  }

  for (const [folder, label] of Object.entries(SUIT_FOLDER_TO_LABEL)) {
    if (normalizeGraphKey(label) === key) {
      return folder as RepeatingCardSuitFolder;
    }
  }

  return null;
}

/** Numerology ref → canonical digit string (`Two` → `2`, `12` → `12`). */
export function normalizeNumerologyRef(ref: string): string | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  if (/^\d{1,2}$/.test(trimmed)) return trimmed;

  const word = trimmed.toLowerCase();
  if (WORD_TO_NUMBER[word]) return WORD_TO_NUMBER[word];

  const slug = slugify(trimmed);
  if (WORD_TO_NUMBER[slug]) return WORD_TO_NUMBER[slug];

  return null;
}

/** Spread ref → canonical spread label when it matches controlled taxonomy. */
export function normalizeSpreadRef(ref: string): (typeof RECENT_CLIENT_SPREADS)[number] | null {
  const key = normalizeGraphKey(ref);
  const match = RECENT_CLIENT_SPREADS.find(
    (spread) => normalizeGraphKey(spread) === key,
  );
  return match ?? null;
}

export function uniqueRefs(refs: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const ref of refs) {
    const trimmed = ref.trim();
    if (!trimmed) continue;
    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    result.push(trimmed);
  }
  return result;
}
