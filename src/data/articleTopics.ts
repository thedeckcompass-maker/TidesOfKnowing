/**
 * Curated article topic taxonomy (single source of truth).
 *
 * Raw frontmatter tags map to topics via `mappedTags` only. Tags never create
 * their own public routes or sitemap entries. The topic directory lives at
 * ARTICLE_TOPICS_HUB_PATH; /articles/ links there instead of listing topics inline.
 */
import { slugify } from "../utils/slugify";

/** Max public topic chips per article card. */
export const ARTICLE_TOPIC_CHIPS_MAX = 3;

/** Reader-facing topic directory (index page lists all indexable topics). */
export const ARTICLE_TOPICS_HUB_PATH = "/articles/topics/";

export const ARTICLE_TOPICS_HUB_ENABLED = true;

export type ArticleTopic = {
  slug: string;
  /** Public-facing label in nav, cards, and topic page H1. */
  label: string;
  /** Topic page intro and meta context. */
  description: string;
  /** Raw tag slugs (slugify(frontmatter tag)) that roll up to this topic. */
  mappedTags: string[];
  /** Show in /articles/ Browse by topic when the topic has live articles. */
  showInNav: boolean;
  /** Allow /articles/topic/{slug}/ and sitemap when content exists. */
  indexable: boolean;
  /** Lower numbers appear first in nav and on cards. */
  navOrder: number;
};

export const ARTICLE_TOPICS: ArticleTopic[] = [
  {
    slug: "ai-and-intuition",
    label: "AI and intuition",
    description:
      "Evergreen essays on what large language models can simulate, what human attention still carries in live reading, and how practitioners can work with both without collapsing practice into performance.",
    mappedTags: [
      "ai-and-intuition",
      "augmented-intuition",
      "language-models",
      "pattern-prediction",
      "pre-symbolic-perception",
      "pre-verbal-cognition",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 10,
  },
  {
    slug: "tarot-methodology",
    label: "Tarot methodology",
    description:
      "Methodology articles on contextual reading, spread architecture, precision, timing as conditions, and the shift from card lists to structured interpretive work.",
    mappedTags: [
      "tarot-methodology",
      "tarot-interpretation",
      "contextual-reading",
      "question-framing",
      "spread-architecture",
      "the-deck-compass",
      "precision-reading",
      "tarot-education",
      "timing-in-tarot",
      "threshold-reading",
      "conditional-interpretation",
      "intuition-development",
      "compass-method",
      "reader-development",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 20,
  },
  {
    slug: "symbolic-perception",
    label: "Symbolic perception",
    description:
      "Writing on pre-symbolic perception, symbolic density in the image, and the perceptual discipline that precedes naming meaning in tarot.",
    mappedTags: [
      "symbolic-perception",
      "pre-symbolic-perception",
      "symbolic-density",
      "intuitive-reading",
      "perceptual-practice",
      "perceptual-skill",
      "soft-eyes-technique",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 30,
  },
  {
    slug: "reading-flow",
    label: "Reading flow",
    description:
      "Articles on connective language between spread positions, live reading narrative, and why readings stall when definitions replace movement through the spread.",
    mappedTags: [
      "reading-flow",
      "connective-language",
      "live-readings",
      "live-tarot-reading",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 40,
  },
  {
    slug: "repeating-tarot-cards",
    label: "Repeating tarot cards",
    description:
      "Authority essays on recurring cards, Major Arcana repetition, and grounded language for patterns that return in a seeker's readings.",
    mappedTags: [
      "repeating-tarot-cards",
      "recurring-tarot-card-meaning",
      "recurring-tarot-card-patterns",
      "repeating-major-arcana-cards",
      "major-arcana",
      "tarot-archetypes",
      "stalker-cards-meaning",
      "the-compass-method",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 50,
  },
  {
    slug: "spiritual-longing",
    label: "Spiritual longing",
    description:
      "The Burn Series and related essays on viraha, devotional fire, collective disconnection, and living with longing as a path of discernment.",
    mappedTags: [
      "spiritual-longing",
      "viraha",
      "bhakti",
      "mystic-traditions",
      "second-half-of-life",
      "living-with-longing",
      "spiritual-practice",
      "presence",
      "life-transition",
      "kali-yuga",
      "spiritual-disconnection",
      "collective-longing",
      "cultural-fragmentation",
      "modern-dissatisfaction",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 60,
  },
  {
    slug: "compass-method",
    label: "The COMPASS Method™",
    description:
      "Framework writing on the COMPASS Method™ and The Deck Compass: seven conditions of attention for clear, grounded intuitive reading under pressure.",
    mappedTags: [
      "compass-method",
      "the-compass-method",
      "reader-development",
      "intuitive-reading-framework",
      "structured-tarot-practice",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 70,
  },
];

export type ArticleTopicChip = {
  slug: string;
  label: string;
  href: string;
};

export type ArticleTopicIndexRow = {
  slug: string;
  label: string;
  description: string;
  articleCount: number;
  href: string;
};

export function articleTopicFilterPath(slug: string): string {
  return `/articles/topic/${slug}/`;
}

export function findArticleTopicsForTagSlug(tagSlug: string): ArticleTopic[] {
  return ARTICLE_TOPICS.filter((t) => t.mappedTags.includes(tagSlug));
}

export function sortArticleTopicsByNavOrder(topics: ArticleTopic[]): ArticleTopic[] {
  return [...topics].sort((a, b) => a.navOrder - b.navOrder || a.label.localeCompare(b.label));
}

export function topicHasLiveArticles(
  topic: ArticleTopic,
  entries: { data: { tags: string[] } }[],
): boolean {
  return entries.some((e) => entryMatchesArticleTopic(e, topic));
}

export function entryMatchesArticleTopic(
  entry: { data: { tags: string[] } },
  topic: ArticleTopic,
): boolean {
  const tagSlugs = entry.data.tags.map((t) => slugify(t));
  return topic.mappedTags.some((s) => tagSlugs.includes(s));
}

/** Indexable topics with at least one article (for sitemap and topic routes). */
export function getIndexableArticleTopicsWithContent(
  entries: { data: { tags: string[] } }[],
): ArticleTopic[] {
  return sortArticleTopicsByNavOrder(
    ARTICLE_TOPICS.filter(
      (t) => t.indexable && topicHasLiveArticles(t, entries),
    ),
  );
}

/** Rows for /articles/topics/ (indexable topics with live articles). */
export function getArticleTopicIndexRows(
  entries: { data: { tags: string[] } }[],
): ArticleTopicIndexRow[] {
  return getIndexableArticleTopicsWithContent(entries).map((topic) => ({
    slug: topic.slug,
    label: topic.label,
    description: topic.description,
    articleCount: entries.filter((e) => entryMatchesArticleTopic(e, topic)).length,
    href: articleTopicFilterPath(topic.slug),
  }));
}

/** Public topic chips for article cards (indexable, nav-ordered, capped). */
export function topicChipsFromArticleTags(tags: string[]): ArticleTopicChip[] {
  const seen = new Set<string>();
  const matched: ArticleTopic[] = [];

  for (const tag of tags) {
    const tagSlug = slugify(tag);
    for (const topic of findArticleTopicsForTagSlug(tagSlug)) {
      if (!topic.indexable || seen.has(topic.slug)) continue;
      seen.add(topic.slug);
      matched.push(topic);
    }
  }

  return sortArticleTopicsByNavOrder(matched)
    .slice(0, ARTICLE_TOPIC_CHIPS_MAX)
    .map((topic) => ({
      slug: topic.slug,
      label: topic.label,
      href: articleTopicFilterPath(topic.slug),
    }));
}
