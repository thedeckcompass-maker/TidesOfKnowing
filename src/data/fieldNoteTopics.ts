/**
 * Curated Field Notes topic taxonomy (single source of truth).
 *
 * Raw frontmatter tags map to topics via `matchTagSlugs` only. Tags never create
 * their own public routes. The topic directory lives at FIELD_NOTE_TOPICS_HUB_PATH;
 * /blog/ links there instead of listing topics inline.
 */
import { slugify } from "../utils/slugify";

export const FIELD_NOTE_TOPICS_HUB_PATH = "/blog/topics/";
export const FIELD_NOTE_TOPICS_HUB_ENABLED = true;

export type FieldNoteTopic = {
  slug: string;
  label: string;
  description: string;
  /** Slugified frontmatter tags that map to this topic page. */
  matchTagSlugs: string[];
  /** Show in legacy nav helpers when content exists. */
  showInNav: boolean;
  /** Allow /blog/topic/{slug}/ and sitemap when content exists. */
  indexable: boolean;
  navOrder: number;
};

/** Meta or structural tags: excluded from visible topic chips. */
export const FIELD_NOTE_META_TAG_SLUGS = new Set([
  "field-notes",
  "cheat-sheet",
  "tides-of-knowing",
]);

export const FIELD_NOTE_TOPICS: FieldNoteTopic[] = [
  {
    slug: "ai-and-intuition",
    label: "AI and intuition",
    description:
      "Field Notes on where machine interpretation stops, what human attention still carries, and how readers can hold both without collapsing practice into performance.",
    matchTagSlugs: ["ai-and-intuition"],
    showInNav: true,
    indexable: true,
    navOrder: 10,
  },
  {
    slug: "tarot-methodology",
    label: "Tarot methodology",
    description:
      "Notes on how tarot is read as structure, movement, and evidence in the image, rather than as fixed meanings retrieved from a list.",
    matchTagSlugs: [
      "tarot-methodology",
      "compass-method",
      "tarot-practice",
      "yes-no-tarot",
      "four-knights-tarot",
      "interpretation-frameworks",
      "the-deck-compass",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 20,
  },
  {
    slug: "seeker-dynamics",
    label: "Seeker dynamics",
    description:
      "Field Notes on how seekers arrive, what grip and pressure do to a reading, and how interpretive work changes under high-stakes conditions.",
    matchTagSlugs: [
      "seeker-dynamics",
      "high-stakes-reading",
      "reading-the-grip",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 30,
  },
  {
    slug: "symbolic-perception",
    label: "Symbolic perception",
    description:
      "Writing on reading the image, symbolic evidence in the cards, and perceptual discipline before meaning is named.",
    matchTagSlugs: [
      "symbolic-perception",
      "symbolic-reading",
      "symbolic-coherence",
      "intuitive-reading",
      "intuitive-tarot",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 40,
  },
  {
    slug: "reading-practice",
    label: "Reading practice",
    description:
      "Practitioner notes on live reading habits, court cards in work, question framing, ethics, lineage, and the daily craft of interpretive attention.",
    matchTagSlugs: [
      "reading-practice",
      "reading-culture",
      "tarot-ethics",
      "reader-development",
      "lineage",
      "matakite",
    ],
    showInNav: true,
    indexable: true,
    navOrder: 50,
  },
];

export type FieldNoteTopicChip = {
  slug: string;
  label: string;
  href: string;
};

export type FieldNoteTopicIndexRow = {
  slug: string;
  label: string;
  description: string;
  noteCount: number;
  href: string;
};

export function topicFilterPath(slug: string): string {
  return `/blog/topic/${slug}/`;
}

export function findTopicsForTagSlug(tagSlug: string): FieldNoteTopic[] {
  return FIELD_NOTE_TOPICS.filter((t) => t.matchTagSlugs.includes(tagSlug));
}

export function sortFieldNoteTopicsByNavOrder(
  topics: FieldNoteTopic[],
): FieldNoteTopic[] {
  return [...topics].sort(
    (a, b) => a.navOrder - b.navOrder || a.label.localeCompare(b.label),
  );
}

export function entryMatchesFieldNoteTopic(
  entry: { data: { tags: string[] } },
  topic: FieldNoteTopic,
): boolean {
  const tagSlugs = entry.data.tags.map((t) => slugify(t));
  return topic.matchTagSlugs.some((s) => tagSlugs.includes(s));
}

export function topicHasLiveFieldNotes(
  topic: FieldNoteTopic,
  entries: { data: { tags: string[] } }[],
): boolean {
  return entries.some((e) => entryMatchesFieldNoteTopic(e, topic));
}

/** Indexable topics with at least one matching Field Note (series, standalone, or part). */
export function getIndexableFieldNoteTopicsWithContent(
  entries: { data: { tags: string[] } }[],
): FieldNoteTopic[] {
  return sortFieldNoteTopicsByNavOrder(
    FIELD_NOTE_TOPICS.filter(
      (t) => t.indexable && topicHasLiveFieldNotes(t, entries),
    ),
  );
}

/** Rows for /blog/topics/. */
export function getFieldNoteTopicIndexRows(
  entries: { data: { tags: string[] } }[],
): FieldNoteTopicIndexRow[] {
  return getIndexableFieldNoteTopicsWithContent(entries).map((topic) => ({
    slug: topic.slug,
    label: topic.label,
    description: topic.description,
    noteCount: entries.filter((e) => entryMatchesFieldNoteTopic(e, topic)).length,
    href: topicFilterPath(topic.slug),
  }));
}

/** Topic chips for a Field Note entry (deduped, crawlable topic URLs only). */
export function topicChipsFromTagSlugs(tagSlugs: string[]): FieldNoteTopicChip[] {
  const seen = new Set<string>();
  const chips: FieldNoteTopicChip[] = [];

  for (const tagSlug of tagSlugs) {
    if (FIELD_NOTE_META_TAG_SLUGS.has(tagSlug)) continue;
    for (const topic of findTopicsForTagSlug(tagSlug)) {
      if (!topic.indexable || seen.has(topic.slug)) continue;
      seen.add(topic.slug);
      chips.push({
        slug: topic.slug,
        label: topic.label,
        href: topicFilterPath(topic.slug),
      });
    }
  }

  return chips;
}

export function topicChipsFromTags(tags: string[]): FieldNoteTopicChip[] {
  return topicChipsFromTagSlugs(tags.map((t) => slugify(t)));
}
