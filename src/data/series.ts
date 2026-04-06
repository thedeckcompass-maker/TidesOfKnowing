/**
 * Optional metadata for series landing pages (`/series/[slug]/`).
 * Keys must match `slugify(seriesName)` from article frontmatter.
 */
export type SeriesMeta = {
  title: string;
  description: string;
  totalParts: number;
  status: "complete" | "ongoing";
  publishedDate: string;
};

export const seriesData: Record<string, SeriesMeta> = {
  "the-deck-compass-methodology-series": {
    title: "The Deck Compass Methodology Series",
    description:
      "A four-part exploration of the cognitive shift in serious tarot practice: from accumulation to precision, from card definitions to contextual meaning, from lists to flow, and from prediction to conditions.",
    totalParts: 4,
    status: "complete",
    publishedDate: "2026-04-06",
  },
};
