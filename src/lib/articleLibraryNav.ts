import type { CollectionEntry } from "astro:content";
import {
  ARTICLE_TOPICS,
  articleTopicFilterPath,
  entryMatchesArticleTopic,
  getArticleTopicIndexRows,
  getIndexableArticleTopicsWithContent,
  topicChipsFromArticleTags,
  type ArticleTopic,
  type ArticleTopicChip,
  type ArticleTopicIndexRow,
} from "../data/articleTopics";
import { groupArticlesBySeries } from "./librarySeries";

export type ArticleEntry = CollectionEntry<"articles">;

export {
  ARTICLE_TOPICS,
  ARTICLE_TOPICS_HUB_ENABLED,
  ARTICLE_TOPICS_HUB_PATH,
  ARTICLE_TOPIC_CHIPS_MAX,
  articleTopicFilterPath,
  entryMatchesArticleTopic,
  getArticleTopicIndexRows,
  getIndexableArticleTopicsWithContent,
  topicChipsFromArticleTags,
};
export type { ArticleTopic, ArticleTopicChip, ArticleTopicIndexRow };

/** @deprecated Use getIndexableArticleTopicsWithContent */
export function getActiveArticleTopics(entries: ArticleEntry[]): ArticleTopic[] {
  return getIndexableArticleTopicsWithContent(entries).filter((t) => t.showInNav);
}

export function getArticleSeriesGroups(entries: ArticleEntry[]) {
  return groupArticlesBySeries(entries);
}

/** Lowercase string for client-side article search on /articles/. */
export function articleSearchHaystack(entry: ArticleEntry): string {
  const d = entry.data;
  const tagText = d.tags.join(" ");
  const topicLabels = topicChipsFromArticleTags(d.tags)
    .map((c) => c.label)
    .join(" ");
  return normalizeSearchText(
    [d.title, d.excerpt, d.seriesName ?? "", tagText, topicLabels].join(" "),
  );
}

function normalizeSearchText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
