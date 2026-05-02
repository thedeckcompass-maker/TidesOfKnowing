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

/** Single chronologically newest article (not the same as first entry in `sortArticlesLibraryNewest` output). */
export function getChronologicallyNewestArticle(
  articles: ArticleEntry[],
): ArticleEntry | undefined {
  if (articles.length === 0) return undefined;
  return [...articles].sort((a, b) => {
    const diff =
      b.data.publishDate.getTime() - a.data.publishDate.getTime();
    if (diff !== 0) return diff;
    return a.data.slug.localeCompare(b.data.slug);
  })[0];
}

export type LibraryFeaturedResult = {
  featured: ArticleEntry[];
  heading: "Latest series" | "Latest articles";
  featuredHeadingId: "latest-series-heading" | "latest-heading";
  ogArticle: ArticleEntry | undefined;
};

/**
 * Featured strip on /articles/: if the chronologically newest post is in a series,
 * show every article in that series (seriesOrder asc; missing order uses publishDate newest-first).
 * Otherwise keep the first `fallbackCount` entries from `sortedNewest` (existing behaviour).
 */
export function getLibraryFeaturedArticles(
  articles: ArticleEntry[],
  sortedNewest: ArticleEntry[],
  fallbackCount: number,
): LibraryFeaturedResult {
  const newest = getChronologicallyNewestArticle(articles);
  if (!newest) {
    return {
      featured: [],
      heading: "Latest articles",
      featuredHeadingId: "latest-heading",
      ogArticle: undefined,
    };
  }

  const seriesName = newest.data.seriesName?.trim();
  if (seriesName) {
    const featured = articles.filter(
      (a) => a.data.seriesName?.trim() === seriesName,
    );
    featured.sort((a, b) => {
      const ao = a.data.seriesOrder ?? 9999;
      const bo = b.data.seriesOrder ?? 9999;
      if (ao !== bo) return ao - bo;
      return b.data.publishDate.getTime() - a.data.publishDate.getTime();
    });
    return {
      featured,
      heading: "Latest series",
      featuredHeadingId: "latest-series-heading",
      ogArticle: newest,
    };
  }

  const featured = sortedNewest.slice(0, fallbackCount);
  return {
    featured,
    heading: "Latest articles",
    featuredHeadingId: "latest-heading",
    ogArticle: featured[0],
  };
}
