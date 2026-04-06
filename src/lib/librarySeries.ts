import type { CollectionEntry } from "astro:content";
import { slugify } from "../utils/slugify";

type ArticleEntry = CollectionEntry<"articles">;

/** Unique series for filter dropdown: slug + display name. */
export function seriesOptionsFromArticles(
  articles: ArticleEntry[],
): { slug: string; label: string }[] {
  const map = new Map<string, string>();
  for (const a of articles) {
    const name = a.data.seriesName;
    if (!name) continue;
    const s = slugify(name);
    if (!map.has(s)) map.set(s, name);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([slug, label]) => ({ slug, label }));
}

/** Collapsible groups: series display name → articles sorted by `seriesOrder`. */
export function groupArticlesBySeries(
  articles: ArticleEntry[],
): { seriesName: string; seriesSlug: string; items: ArticleEntry[] }[] {
  const groups = new Map<string, ArticleEntry[]>();
  for (const a of articles) {
    const name = a.data.seriesName;
    if (!name) continue;
    const list = groups.get(name) ?? [];
    list.push(a);
    groups.set(name, list);
  }
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        (a.data.seriesOrder ?? 9999) - (b.data.seriesOrder ?? 9999),
    );
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([seriesName, items]) => ({
      seriesName,
      seriesSlug: slugify(seriesName),
      items,
    }));
}
