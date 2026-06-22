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

/** Filter/library lede — no leading “the” or trailing “series” (titles may already include “The”). */
export function seriesFilterDescription(seriesTitle: string): string {
  return `Articles in “${seriesTitle}” from Tides of Knowing.`;
}

/** Series landing fallback when `seriesData[slug]` has no description. */
export function seriesLandingFallbackDescription(seriesTitle: string): string {
  return seriesFilterDescription(seriesTitle);
}

export const seriesData: Record<string, SeriesMeta> = {
  "the-ai-and-intuition-series": {
    title: "The AI and Intuition Series",
    description:
      "Seven essays on what large language models can and cannot reach in intuitive practice: pre-symbolic perception, tarot as interface, meaning versus attention, augmentation versus replacement, and the practitioner’s edge.",
    totalParts: 7,
    status: "complete",
    publishedDate: "2026-05-03",
  },
  "the-deck-compass-methodology-series": {
    title: "The Deck Compass Methodology Series",
    description:
      "A four-part exploration of the cognitive shift in serious tarot practice: from accumulation to precision, from card definitions to contextual meaning, from lists to flow, and from prediction to conditions.",
    totalParts: 4,
    status: "complete",
    publishedDate: "2026-04-06",
  },
  "repeating-card-patterns": {
    title: "Repeating Card Patterns",
    description:
      "Three anchor essays on tarot recurrence: why the same card keeps appearing, what repeating Major Arcana cards signal, and how repeating cards differ from stalker-card language.",
    totalParts: 3,
    status: "complete",
    publishedDate: "2026-05-18",
  },
  "the-burn-series": {
    title: "The Burn Series",
    description:
      "The Burn Series explores spiritual longing, devotional fire, disconnection, and the human need for living connection in an age of noise. Written through the Tides of Knowing lens, the series traces how longing can become a path of discernment rather than a wound to be solved. It draws from viraha, bhakti, Krishna devotion, mystic traditions, and the lived experience of seeking meaning when modern life has become thin, fast, and disconnected.",
    totalParts: 3,
    status: "complete",
    publishedDate: "2026-05-25",
  },
  "the-discernment-series": {
    title: "The Discernment Series",
    description:
      "A three-part tarot methodology series on recognising the right question, knowing when more cards add noise instead of clarity, and closing a reading when the answer has landed.",
    totalParts: 3,
    status: "complete",
    publishedDate: "2026-06-22",
  },
};
