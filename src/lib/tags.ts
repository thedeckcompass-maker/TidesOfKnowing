import type { CollectionEntry } from "astro:content";
import { slugify } from "../utils/slugify";

type ArticleEntry = CollectionEntry<"articles">;

export type TagIndexEntry = {
  slug: string;
  label: string;
  count: number;
};

export function tagsFromArticles(articles: ArticleEntry[]): TagIndexEntry[] {
  const map = new Map<string, { label: string; count: number }>();
  for (const a of articles) {
    for (const t of a.data.tags) {
      const s = slugify(t);
      const cur = map.get(s);
      if (!cur) map.set(s, { label: t, count: 1 });
      else cur.count += 1;
    }
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function articlesWithTagSlug(
  articles: ArticleEntry[],
  tagSlug: string,
): ArticleEntry[] {
  return articles.filter((a) =>
    a.data.tags.some((t) => slugify(t) === tagSlug),
  );
}
