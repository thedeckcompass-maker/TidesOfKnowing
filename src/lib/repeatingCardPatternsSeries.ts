/** Editorial mini-series: anchor articles on repeating tarot card patterns. */
export const REPEATING_CARD_PATTERNS_SERIES_NAME = "Repeating Card Patterns";

export type RepeatingCardPatternsArticle = {
  slug: string;
  title: string;
  /** One-line description for hub, tool, and in-article continuation links. */
  summary: string;
  order: number;
};

export const repeatingCardPatternsArticles: RepeatingCardPatternsArticle[] = [
  {
    slug: "why-the-same-tarot-card-keeps-appearing",
    title: "Why the Same Tarot Card Keeps Appearing",
    summary:
      "A grounded guide to symbolic repetition, timescales, and reading recurring cards without fear or fixation.",
    order: 1,
  },
  {
    slug: "repeating-major-arcana-cards",
    title: "Repeating Major Arcana Cards",
    summary:
      "How recurring Major Arcana cards mark archetypal themes, life transitions, and sustained symbolic pressure.",
    order: 2,
  },
  {
    slug: "repeating-cards-vs-stalker-cards",
    title: "Repeating Cards vs Stalker Cards",
    summary:
      "The difference between genuine symbolic recurrence, fixation, and the language of stalker cards in tarot practice.",
    order: 3,
  },
];

const slugSet = new Set(repeatingCardPatternsArticles.map((a) => a.slug));

export function isRepeatingCardPatternsArticle(slug: string): boolean {
  return slugSet.has(slug);
}

export function repeatingCardPatternsArticleHref(slug: string): string {
  return `/articles/${slug}/`;
}
