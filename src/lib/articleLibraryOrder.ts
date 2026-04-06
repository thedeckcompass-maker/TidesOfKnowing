import type { CollectionEntry } from "astro:content";

type ArticleEntry = CollectionEntry<"articles">;

function isStandalone(a: ArticleEntry): boolean {
  return !a.data.seriesName?.trim();
}

/** Reading order within a single series (non-empty seriesName). */
function sortWithinSeries(items: ArticleEntry[]): ArticleEntry[] {
  return [...items].sort((a, b) => {
    const ao = a.data.seriesOrder ?? 9999;
    const bo = b.data.seriesOrder ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.data.publishDate.getTime() - b.data.publishDate.getTime();
  });
}

type Unit = {
  items: ArticleEntry[];
  newestMs: number;
  oldestMs: number;
  tieSlug: string;
};

function buildUnits(articles: ArticleEntry[]): Unit[] {
  const standalone = articles.filter(isStandalone);
  const inSeries = articles.filter((a) => !isStandalone(a));
  const byName = new Map<string, ArticleEntry[]>();
  for (const a of inSeries) {
    const k = a.data.seriesName!.trim();
    const list = byName.get(k) ?? [];
    list.push(a);
    byName.set(k, list);
  }

  const units: Unit[] = [];
  for (const a of standalone) {
    const t = a.data.publishDate.getTime();
    units.push({
      items: [a],
      newestMs: t,
      oldestMs: t,
      tieSlug: a.data.slug,
    });
  }
  for (const raw of byName.values()) {
    const items = sortWithinSeries(raw);
    const times = items.map((x) => x.data.publishDate.getTime());
    units.push({
      items,
      newestMs: Math.max(...times),
      oldestMs: Math.min(...times),
      tieSlug: items[0]!.data.slug,
    });
  }
  return units;
}

/**
 * Default article hub / topic lists: each standalone post is its own unit; all pieces
 * sharing seriesName are one unit. Within a series, order is seriesOrder then publishDate.
 * Units are sorted by the newest publishDate inside the unit (series surfaces when any part is new).
 */
export function sortArticlesLibraryNewest(
  articles: ArticleEntry[],
): ArticleEntry[] {
  const units = buildUnits(articles);
  units.sort((u, v) => {
    if (v.newestMs !== u.newestMs) return v.newestMs - u.newestMs;
    return u.tieSlug.localeCompare(v.tieSlug);
  });
  return units.flatMap((u) => u.items);
}

/**
 * Oldest-first library: same units; order units by earliest publishDate in the unit.
 * Series internals stay part 1 → N.
 */
export function sortArticlesLibraryOldest(
  articles: ArticleEntry[],
): ArticleEntry[] {
  const units = buildUnits(articles);
  units.sort((u, v) => {
    if (u.oldestMs !== v.oldestMs) return u.oldestMs - v.oldestMs;
    return u.tieSlug.localeCompare(v.tieSlug);
  });
  return units.flatMap((u) => u.items);
}
