import type { RecentClientReadingEntry } from "../recentClientReadings";
import type { KnowledgeGraphCatalog } from "./catalog";
import { normalizeCardRef } from "./normalize";

function readingSlugsFromIndex(
  catalog: KnowledgeGraphCatalog,
  index: Map<string, Set<string>>,
  key: string,
  options: { excludeSlug?: string; limit?: number } = {},
): string[] {
  const bucket = index.get(key);
  if (!bucket) return [];

  const slugs = [...bucket].filter((slug) => slug !== options.excludeSlug);
  if (options.limit !== undefined) return slugs.slice(0, options.limit);
  return slugs;
}

function entriesFromSlugs(
  catalog: KnowledgeGraphCatalog,
  slugs: string[],
): RecentClientReadingEntry[] {
  return slugs
    .map((slug) => catalog.clientReadings.bySlug.get(slug))
    .filter((entry): entry is RecentClientReadingEntry => Boolean(entry));
}

/** Published client readings that reference a tarot card (explicit or derived). */
export function findClientReadingsByCardRef(
  catalog: KnowledgeGraphCatalog,
  cardRef: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slug = normalizeCardRef(cardRef);
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.byCardSlug,
    slug,
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}

/** Published client readings associated with a suit folder (`cups`, `majors`, etc.). */
export function findClientReadingsBySuitFolder(
  catalog: KnowledgeGraphCatalog,
  suitFolder: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.bySuitFolder,
    suitFolder,
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}

/** Published client readings associated with a tarot number (`2`, `12`, etc.). */
export function findClientReadingsByNumber(
  catalog: KnowledgeGraphCatalog,
  number: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.byNumber,
    number,
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}

/** Published client readings that used a given spread. */
export function findClientReadingsBySpread(
  catalog: KnowledgeGraphCatalog,
  spread: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.bySpread,
    spread,
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}

/** Published client readings tagged with a life area. */
export function findClientReadingsByLifeArea(
  catalog: KnowledgeGraphCatalog,
  lifeArea: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.byLifeArea,
    lifeArea,
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}

/** Published client readings with an archetypal theme. */
export function findClientReadingsByArchetypalTheme(
  catalog: KnowledgeGraphCatalog,
  theme: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.byArchetypalTheme,
    theme,
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}

/** Published client readings with a matching tag (case-insensitive). */
export function findClientReadingsByTag(
  catalog: KnowledgeGraphCatalog,
  tag: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.byTag,
    tag.toLowerCase(),
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}

/** Published client readings of a given Ask Leilia reading type. */
export function findClientReadingsByReadingType(
  catalog: KnowledgeGraphCatalog,
  readingType: string,
  options: { excludeSlug?: string; limit?: number } = {},
): RecentClientReadingEntry[] {
  const slugs = readingSlugsFromIndex(
    catalog,
    catalog.clientReadingIndexes.byReadingType,
    readingType,
    options,
  );
  return entriesFromSlugs(catalog, slugs);
}
