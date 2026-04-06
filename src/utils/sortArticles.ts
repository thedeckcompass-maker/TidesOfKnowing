import type { CollectionEntry } from "astro:content";

type ArticleEntry = CollectionEntry<"articles">;

export type ArticleSortMode = "newest" | "oldest" | "series";

/** Returns a new array sorted by `sortBy` (does not mutate input). */
export function sortArticles(
  articles: ArticleEntry[],
  sortBy: ArticleSortMode = "newest",
): ArticleEntry[] {
  const list = [...articles];
  switch (sortBy) {
    case "oldest":
      return list.sort(
        (a, b) =>
          a.data.publishDate.getTime() - b.data.publishDate.getTime(),
      );
    case "series":
      return list.sort((a, b) => {
        const an = a.data.seriesName ?? "\uffff";
        const bn = b.data.seriesName ?? "\uffff";
        if (an !== bn) return an.localeCompare(bn);
        const ao = a.data.seriesOrder ?? 9999;
        const bo = b.data.seriesOrder ?? 9999;
        if (ao !== bo) return ao - bo;
        // Same order: oldest first so reading sequence matches publication when order is unset.
        return a.data.publishDate.getTime() - b.data.publishDate.getTime();
      });
    case "newest":
    default:
      return list.sort(
        (a, b) =>
          b.data.publishDate.getTime() - a.data.publishDate.getTime(),
      );
  }
}
