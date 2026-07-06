import type { RecentClientReadingEntry } from "../recentClientReadings";
import type { KnowledgeGraphCatalog } from "./catalog";
import {
  resolveTarotCardEntry,
  uniqueCardRefsFromReading,
  uniqueNumberRefsFromReading,
  uniqueSpreadRefsFromReading,
  uniqueSuitRefsFromReading,
} from "./catalog";
import {
  buildClientReadingLink,
  buildFieldNoteLink,
  buildNumerologyLink,
  buildSpreadLink,
  buildSuitLink,
  buildTarotCardLink,
  isRoutableTarotCard,
  resolveFieldNoteByRef,
} from "./entityRoutes";
import {
  normalizeFieldNoteRef,
  normalizeNumerologyRef,
  normalizeSpreadRef,
  normalizeSuitFolder,
  uniqueRefs,
} from "./normalize";
import {
  KNOWLEDGE_GRAPH_SECTION_HEADINGS,
  KNOWLEDGE_GRAPH_SECTION_ORDER,
  type KnowledgeGraphEntityKind,
  type KnowledgeGraphExplore,
  type KnowledgeGraphLink,
  type KnowledgeGraphSection,
} from "./types";

const MAX_CLIENT_READING_LINKS = 6;
const MAX_INFERRED_CLIENT_READINGS = 4;

function pushUniqueLink(
  links: KnowledgeGraphLink[],
  seen: Set<string>,
  link: KnowledgeGraphLink,
): void {
  const key = `${link.kind}:${link.ref}`;
  if (seen.has(key)) return;
  seen.add(key);
  links.push(link);
}

function resolveTarotCardLinks(
  entry: RecentClientReadingEntry,
  catalog: KnowledgeGraphCatalog,
): KnowledgeGraphLink[] {
  const refs = uniqueCardRefsFromReading(entry);
  const links: KnowledgeGraphLink[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const card = resolveTarotCardEntry(ref, catalog.tarotCards);
    if (!isRoutableTarotCard(card)) continue;
    const built = buildTarotCardLink(card);
    pushUniqueLink(links, seen, {
      kind: "tarot-card",
      ...built,
    });
  }

  return links;
}

function resolveSuitLinks(
  entry: RecentClientReadingEntry,
  catalog: KnowledgeGraphCatalog,
): KnowledgeGraphLink[] {
  const explicit = entry.data.relatedSuits
    .map((ref) => normalizeSuitFolder(ref))
    .filter((folder): folder is NonNullable<typeof folder> => Boolean(folder));

  const derived = uniqueSuitRefsFromReading(entry, catalog.tarotCards);
  const folders = new Set([...explicit, ...derived]);
  const links: KnowledgeGraphLink[] = [];
  const seen = new Set<string>();

  for (const folder of folders) {
    const built = buildSuitLink(folder);
    pushUniqueLink(links, seen, {
      kind: "suit",
      ...built,
    });
  }

  return links;
}

function resolveNumerologyLinks(
  entry: RecentClientReadingEntry,
  catalog: KnowledgeGraphCatalog,
): KnowledgeGraphLink[] {
  const numbers = new Set<string>();

  for (const ref of entry.data.relatedNumbers) {
    const normalized = normalizeNumerologyRef(ref);
    if (normalized) numbers.add(normalized);
  }

  for (const number of uniqueNumberRefsFromReading(entry, catalog.tarotCards)) {
    const normalized = normalizeNumerologyRef(number);
    if (normalized) numbers.add(normalized);
  }

  const links: KnowledgeGraphLink[] = [];
  const seen = new Set<string>();

  for (const number of numbers) {
    const built = buildNumerologyLink(number);
    if (!built) continue;
    pushUniqueLink(links, seen, {
      kind: "numerology",
      ...built,
    });
  }

  return links;
}

function resolveSpreadLinks(entry: RecentClientReadingEntry): KnowledgeGraphLink[] {
  const spreads = new Set<string>();

  for (const ref of entry.data.relatedSpreads) {
    const normalized = normalizeSpreadRef(ref);
    if (normalized) spreads.add(normalized);
  }

  const primary = normalizeSpreadRef(entry.data.spreadUsed);
  if (primary) spreads.add(primary);

  const links: KnowledgeGraphLink[] = [];
  const seen = new Set<string>();

  for (const spread of spreads) {
    const built = buildSpreadLink(spread);
    pushUniqueLink(links, seen, {
      kind: "spread",
      ...built,
    });
  }

  return links;
}

function resolveFieldNoteLinks(
  entry: RecentClientReadingEntry,
  catalog: KnowledgeGraphCatalog,
  blogEntries: Parameters<typeof resolveFieldNoteByRef>[1],
): KnowledgeGraphLink[] {
  const refs = uniqueRefs(entry.data.relatedFieldNotes);
  const links: KnowledgeGraphLink[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const normalized = normalizeFieldNoteRef(ref);
    const note =
      catalog.fieldNotes.byRef.get(normalized) ??
      resolveFieldNoteByRef(normalized, blogEntries);
    if (!note) continue;
    const built = buildFieldNoteLink(note);
    pushUniqueLink(links, seen, {
      kind: "field-note",
      ...built,
    });
  }

  return links;
}

function scoreInferredReading(
  source: RecentClientReadingEntry,
  candidate: RecentClientReadingEntry,
  catalog: KnowledgeGraphCatalog,
): number {
  let score = 0;
  if (candidate.data.spreadUsed === source.data.spreadUsed) score += 2;

  const sourceCards = new Set(
    uniqueCardRefsFromReading(source).map((ref) =>
      resolveTarotCardEntry(ref, catalog.tarotCards)?.id,
    ),
  );
  const candidateCards = uniqueCardRefsFromReading(candidate)
    .map((ref) => resolveTarotCardEntry(ref, catalog.tarotCards)?.id)
    .filter(Boolean);
  for (const id of candidateCards) {
    if (id && sourceCards.has(id)) score += 3;
  }

  const sourceAreas = new Set(source.data.lifeAreas);
  for (const area of candidate.data.lifeAreas) {
    if (sourceAreas.has(area)) score += 1;
  }

  const sourceThemes = new Set(source.data.archetypalThemes);
  for (const theme of candidate.data.archetypalThemes) {
    if (sourceThemes.has(theme)) score += 1;
  }

  return score;
}

function resolveClientReadingLinks(
  entry: RecentClientReadingEntry,
  catalog: KnowledgeGraphCatalog,
): KnowledgeGraphLink[] {
  const links: KnowledgeGraphLink[] = [];
  const seen = new Set<string>();
  const selfSlug = entry.data.slug;

  for (const ref of uniqueRefs(entry.data.relatedReadings)) {
    const related = catalog.clientReadings.bySlug.get(ref);
    if (!related || related.data.slug === selfSlug) continue;
    const built = buildClientReadingLink(related);
    pushUniqueLink(links, seen, {
      kind: "client-reading",
      ...built,
    });
  }

  if (links.length < MAX_CLIENT_READING_LINKS) {
    const inferred = catalog.clientReadings.published
      .filter((candidate) => candidate.data.slug !== selfSlug)
      .map((candidate) => ({
        candidate,
        score: scoreInferredReading(entry, candidate, catalog),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_INFERRED_CLIENT_READINGS);

    for (const { candidate } of inferred) {
      if (links.length >= MAX_CLIENT_READING_LINKS) break;
      const built = buildClientReadingLink(candidate);
      pushUniqueLink(links, seen, {
        kind: "client-reading",
        ...built,
      });
    }
  }

  return links.slice(0, MAX_CLIENT_READING_LINKS);
}

const SECTION_RESOLVERS: Record<
  KnowledgeGraphEntityKind,
  (
    entry: RecentClientReadingEntry,
    catalog: KnowledgeGraphCatalog,
    blogEntries: Parameters<typeof resolveFieldNoteByRef>[1],
  ) => KnowledgeGraphLink[]
> = {
  "tarot-card": (entry, catalog) => resolveTarotCardLinks(entry, catalog),
  suit: (entry, catalog) => resolveSuitLinks(entry, catalog),
  numerology: (entry, catalog) => resolveNumerologyLinks(entry, catalog),
  spread: (entry) => resolveSpreadLinks(entry),
  "field-note": (entry, catalog, blogEntries) =>
    resolveFieldNoteLinks(entry, catalog, blogEntries),
  "client-reading": (entry, catalog) => resolveClientReadingLinks(entry, catalog),
};

/**
 * Resolve all Continue Exploring sections for a client reading.
 * Empty sections are omitted.
 */
export function resolveReadingKnowledgeGraph(
  entry: RecentClientReadingEntry,
  catalog: KnowledgeGraphCatalog,
  blogEntries: Parameters<typeof resolveFieldNoteByRef>[1],
): KnowledgeGraphExplore {
  const sections: KnowledgeGraphSection[] = [];

  for (const kind of KNOWLEDGE_GRAPH_SECTION_ORDER) {
    const links = SECTION_RESOLVERS[kind](entry, catalog, blogEntries);
    if (links.length === 0) continue;
    sections.push({
      kind,
      heading: KNOWLEDGE_GRAPH_SECTION_HEADINGS[kind],
      links,
    });
  }

  return {
    sections,
    hasContent: sections.length > 0,
  };
}
