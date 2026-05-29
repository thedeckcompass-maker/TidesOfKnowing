import type { CollectionEntry } from "astro:content";
import {
  seriesData,
  seriesLandingFallbackDescription,
  type SeriesMeta,
} from "../data/series";
import { groupArticlesBySeries } from "./librarySeries";

export type ArticleEntry = CollectionEntry<"articles">;

export const ARTICLE_SERIES_HUB_PATH = "/articles/series/";

export type ArticleSeriesIndexRow = {
  seriesSlug: string;
  seriesName: string;
  description: string;
  partCount: number;
  heroImage: string;
  heroImageAlt: string;
  seriesPageHref: string;
  status?: SeriesMeta["status"];
};

/** Rows for /articles/series/ (article series with hero from first part). */
export function getArticleSeriesIndexRows(
  articles: ArticleEntry[],
): ArticleSeriesIndexRow[] {
  return groupArticlesBySeries(articles)
    .map((g) => {
      const meta = seriesData[g.seriesSlug];
      const first = g.items[0];
      const displayName = meta?.title ?? g.seriesName;
      return {
        seriesSlug: g.seriesSlug,
        seriesName: displayName,
        description:
          meta?.description ?? seriesLandingFallbackDescription(g.seriesName),
        partCount: g.items.length,
        heroImage: first?.data.heroImage ?? "/favicon.svg",
        heroImageAlt: first?.data.heroImageAlt ?? displayName,
        seriesPageHref: `/series/${g.seriesSlug}/`,
        status: meta?.status,
      };
    })
    .sort((a, b) => a.seriesName.localeCompare(b.seriesName));
}
