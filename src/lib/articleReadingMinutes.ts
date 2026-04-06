import type { CollectionEntry } from "astro:content";
import { estimateReadingMinutes } from "./readingTime";

export function readingMinutesForArticle(
  article: CollectionEntry<"articles">,
): number {
  const body = article.body ?? "";
  return article.data.readingTime ?? estimateReadingMinutes(body);
}
