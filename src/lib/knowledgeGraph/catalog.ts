import type { CollectionEntry } from "astro:content";
import {
  fieldNoteSlugFromEntry,
  filterPublished,
  isSeriesFieldNote,
  isStandaloneFieldNote,
  seriesSlugFromEntry,
  standaloneSlugFromEntry,
  type BlogEntry,
} from "../blogFieldNotes";
import {
  buildRepeatingCardSlugIndex,
  repeatingCardSlugFromId,
  type RepeatingCardSuitFolder,
} from "../repeatingCardMeanings";
import { normalizeGraphKey } from "./normalize";
import {
  getPublishedReadings,
  type RecentClientReadingEntry,
} from "../recentClientReadings";
import { normalizeCardRef } from "./normalize";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

export type KnowledgeGraphTarotCardIndex = {
  byId: Map<string, RepeatingCardEntry>;
  bySlug: Map<string, RepeatingCardEntry>;
  slugToId: Map<string, string>;
  byTitleKey: Map<string, RepeatingCardEntry>;
};

export type KnowledgeGraphFieldNoteIndex = {
  byRef: Map<string, BlogEntry>;
};

export type KnowledgeGraphClientReadingIndex = {
  bySlug: Map<string, RecentClientReadingEntry>;
  published: RecentClientReadingEntry[];
};

export type ClientReadingRelationshipIndexes = {
  byCardSlug: Map<string, Set<string>>;
  bySuitFolder: Map<string, Set<string>>;
  byNumber: Map<string, Set<string>>;
  bySpread: Map<string, Set<string>>;
  byLifeArea: Map<string, Set<string>>;
  byArchetypalTheme: Map<string, Set<string>>;
  byTag: Map<string, Set<string>>;
  byReadingType: Map<string, Set<string>>;
};

export type KnowledgeGraphCatalog = {
  tarotCards: KnowledgeGraphTarotCardIndex;
  fieldNotes: KnowledgeGraphFieldNoteIndex;
  clientReadings: KnowledgeGraphClientReadingIndex;
  clientReadingIndexes: ClientReadingRelationshipIndexes;
};

function addToIndex(
  map: Map<string, Set<string>>,
  key: string,
  readingSlug: string,
): void {
  const bucket = map.get(key) ?? new Set<string>();
  bucket.add(readingSlug);
  map.set(key, bucket);
}

function cardSlugsForReading(
  entry: RecentClientReadingEntry,
  cards: KnowledgeGraphTarotCardIndex,
): string[] {
  const refs = uniqueCardRefsFromReading(entry);
  const slugs: string[] = [];
  for (const ref of refs) {
    const slug = normalizeCardRef(ref);
    if (slug && cards.bySlug.has(slug)) slugs.push(slug);
  }
  return slugs;
}

export function uniqueCardRefsFromReading(entry: RecentClientReadingEntry): string[] {
  const seen = new Set<string>();
  const refs: string[] = [];
  const all = [
    ...entry.data.relatedCards,
    ...entry.data.primaryCards,
    ...entry.data.secondaryCards,
    ...entry.data.cardsFeatured,
  ];
  for (const ref of all) {
    const key = ref.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    refs.push(ref.trim());
  }
  return refs;
}

export function uniqueSuitRefsFromReading(
  entry: RecentClientReadingEntry,
  cards: KnowledgeGraphTarotCardIndex,
): RepeatingCardSuitFolder[] {
  const folders = new Set<RepeatingCardSuitFolder>();

  for (const ref of entry.data.relatedSuits) {
    const folder = suitFolderFromLabel(ref);
    if (folder) folders.add(folder);
  }

  const dominantFolder = suitFolderFromDominantSuit(entry.data.dominantSuit);
  if (dominantFolder) folders.add(dominantFolder);

  for (const ref of uniqueCardRefsFromReading(entry)) {
    const slug = normalizeCardRef(ref);
    const card = cards.bySlug.get(slug);
    if (!card) continue;
    const folder = card.id.split("/")[0] as RepeatingCardSuitFolder;
    if (folder) folders.add(folder);
  }

  return [...folders];
}

export function uniqueNumberRefsFromReading(
  entry: RecentClientReadingEntry,
  cards: KnowledgeGraphTarotCardIndex,
): string[] {
  const numbers = new Set<string>();

  for (const ref of entry.data.relatedNumbers) {
    const normalized = ref.trim();
    if (normalized) numbers.add(normalized);
  }

  for (const ref of uniqueCardRefsFromReading(entry)) {
    const slug = normalizeCardRef(ref);
    const card = cards.bySlug.get(slug);
    const cardNumber = card?.data.card_number?.trim();
    if (cardNumber) numbers.add(cardNumber);
  }

  return [...numbers];
}

export function uniqueSpreadRefsFromReading(entry: RecentClientReadingEntry): string[] {
  const spreads = new Set<string>();
  for (const ref of entry.data.relatedSpreads) {
    const trimmed = ref.trim();
    if (trimmed) spreads.add(trimmed);
  }
  spreads.add(entry.data.spreadUsed);
  return [...spreads];
}

function suitFolderFromDominantSuit(
  suit: RecentClientReadingEntry["data"]["dominantSuit"],
): RepeatingCardSuitFolder | null {
  const map: Partial<Record<string, RepeatingCardSuitFolder>> = {
    Cups: "cups",
    Wands: "wands",
    Swords: "swords",
    Pentacles: "pentacles",
    "Major Arcana": "majors",
  };
  return map[suit] ?? null;
}

function suitFolderFromLabel(label: string): RepeatingCardSuitFolder | null {
  const key = label.trim().toLowerCase();
  const map: Record<string, RepeatingCardSuitFolder> = {
    cups: "cups",
    wands: "wands",
    swords: "swords",
    pentacles: "pentacles",
    majors: "majors",
    "major arcana": "majors",
  };
  return map[key] ?? null;
}

function buildTarotCardIndex(
  entries: RepeatingCardEntry[],
): KnowledgeGraphTarotCardIndex {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const slugToId = buildRepeatingCardSlugIndex(entries);
  const bySlug = new Map<string, RepeatingCardEntry>();
  const byTitleKey = new Map<string, RepeatingCardEntry>();

  for (const entry of entries) {
    const slug = repeatingCardSlugFromId(entry.id);
    bySlug.set(slug, entry);

    const titleKey = normalizeGraphKey(entry.data.title);
    if (titleKey) byTitleKey.set(titleKey, entry);

    const plainTitle = normalizeGraphKey(
      entry.data.title.replace(/\s+Repeating Meaning$/i, ""),
    );
    if (plainTitle) byTitleKey.set(plainTitle, entry);
  }

  return { byId, bySlug, slugToId, byTitleKey };
}

function buildFieldNoteIndex(blogEntries: BlogEntry[]): KnowledgeGraphFieldNoteIndex {
  const byRef = new Map<string, BlogEntry>();
  const published = filterPublished(blogEntries);

  for (const entry of published) {
    if (isStandaloneFieldNote(entry)) {
      byRef.set(standaloneSlugFromEntry(entry), entry);
      continue;
    }
    if (isSeriesFieldNote(entry)) {
      const seriesSlug = seriesSlugFromEntry(entry)!;
      const noteSlug = fieldNoteSlugFromEntry(entry);
      byRef.set(`${seriesSlug}/${noteSlug}`, entry);
      byRef.set(noteSlug, entry);
    }
  }

  return { byRef };
}

function buildClientReadingIndexes(
  published: RecentClientReadingEntry[],
  cards: KnowledgeGraphTarotCardIndex,
): ClientReadingRelationshipIndexes {
  const indexes: ClientReadingRelationshipIndexes = {
    byCardSlug: new Map(),
    bySuitFolder: new Map(),
    byNumber: new Map(),
    bySpread: new Map(),
    byLifeArea: new Map(),
    byArchetypalTheme: new Map(),
    byTag: new Map(),
    byReadingType: new Map(),
  };

  for (const entry of published) {
    const slug = entry.data.slug;

    for (const cardSlug of cardSlugsForReading(entry, cards)) {
      addToIndex(indexes.byCardSlug, cardSlug, slug);
    }

    for (const folder of uniqueSuitRefsFromReading(entry, cards)) {
      addToIndex(indexes.bySuitFolder, folder, slug);
    }

    for (const number of uniqueNumberRefsFromReading(entry, cards)) {
      addToIndex(indexes.byNumber, number, slug);
    }

    for (const spread of uniqueSpreadRefsFromReading(entry)) {
      addToIndex(indexes.bySpread, spread, slug);
    }

    for (const area of entry.data.lifeAreas) {
      addToIndex(indexes.byLifeArea, area, slug);
    }

    for (const theme of entry.data.archetypalThemes) {
      addToIndex(indexes.byArchetypalTheme, theme, slug);
    }

    for (const tag of entry.data.tags) {
      addToIndex(indexes.byTag, tag.toLowerCase(), slug);
    }

    addToIndex(indexes.byReadingType, entry.data.readingType, slug);
  }

  return indexes;
}

export function buildKnowledgeGraphCatalog(input: {
  repeatingCardMeanings: RepeatingCardEntry[];
  blog: BlogEntry[];
  recentClientReadings: RecentClientReadingEntry[];
}): KnowledgeGraphCatalog {
  const tarotCards = buildTarotCardIndex(input.repeatingCardMeanings);
  const fieldNotes = buildFieldNoteIndex(input.blog);
  const published = getPublishedReadings(input.recentClientReadings);
  const clientReadings = {
    bySlug: new Map(published.map((entry) => [entry.data.slug, entry])),
    published,
  };
  const clientReadingIndexes = buildClientReadingIndexes(published, tarotCards);

  return {
    tarotCards,
    fieldNotes,
    clientReadings,
    clientReadingIndexes,
  };
}

export function resolveTarotCardEntry(
  ref: string,
  cards: KnowledgeGraphTarotCardIndex,
): RepeatingCardEntry | undefined {
  const trimmed = ref.trim();
  if (!trimmed) return undefined;

  if (trimmed.includes("/")) {
    return cards.byId.get(trimmed) ?? cards.byId.get(trimmed.replace(/^\/+|\/+$/g, ""));
  }

  const slug = normalizeCardRef(trimmed);
  const bySlug = cards.bySlug.get(slug);
  if (bySlug) return bySlug;

  const titleKey = normalizeGraphKey(trimmed);
  return cards.byTitleKey.get(titleKey);
}
