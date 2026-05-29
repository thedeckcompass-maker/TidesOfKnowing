import type { CollectionEntry } from "astro:content";
import {
  entryMatchesFieldNoteTopic,
  FIELD_NOTE_TOPICS,
  FIELD_NOTE_TOPICS_HUB_ENABLED,
  FIELD_NOTE_TOPICS_HUB_PATH,
  getFieldNoteTopicIndexRows,
  getIndexableFieldNoteTopicsWithContent,
  topicChipsFromTags,
  topicFilterPath,
  type FieldNoteTopic,
  type FieldNoteTopicChip,
  type FieldNoteTopicIndexRow,
} from "../data/fieldNoteTopics";
export type { FieldNoteTopic, FieldNoteTopicChip, FieldNoteTopicIndexRow };
export {
  FIELD_NOTE_TOPICS,
  FIELD_NOTE_TOPICS_HUB_ENABLED,
  FIELD_NOTE_TOPICS_HUB_PATH,
  getFieldNoteTopicIndexRows,
  getIndexableFieldNoteTopicsWithContent,
  topicFilterPath,
  topicChipsFromTags,
};

export type BlogEntry = CollectionEntry<"blog">;
export type BlogEntryType = BlogEntry["data"]["type"];

const FIELD_NOTES_DEFINITION =
  "Field Notes on Tides of Knowing document real practice: anonymised where necessary, reflective always. They are not theory. They are the work, observed closely.";

export { FIELD_NOTES_DEFINITION };

/** Editorial footer for standalone foundational Field Notes (not series, not practitioner walkthroughs). */
export const FOUNDATIONAL_FIELD_NOTE_FOOTER =
  "A foundational Field Note in the Tides of Knowing archive: writing on perception, intuitive tarot practice, and the interpretive roots of The COMPASS Method™.";

export function isFoundationalFieldNote(entry: BlogEntry): boolean {
  return (
    isStandaloneFieldNote(entry) && entry.data.fieldNoteKind === "foundational"
  );
}

export function blogEntryType(entry: BlogEntry): BlogEntryType {
  return entry.data.type ?? "field-note";
}

export function isSeriesEntry(entry: BlogEntry): boolean {
  return blogEntryType(entry) === "series";
}

export function isCheatSheetEntry(entry: BlogEntry): boolean {
  return blogEntryType(entry) === "cheat-sheet";
}

export function isFieldNoteEntry(entry: BlogEntry): boolean {
  return blogEntryType(entry) === "field-note";
}

/** Standalone field note at `/blog/[slug]/` (legacy and new). */
export function isStandaloneFieldNote(entry: BlogEntry): boolean {
  return isFieldNoteEntry(entry) && !entry.data.seriesSlug?.trim();
}

/** Field note published inside a series folder. */
export function isSeriesFieldNote(entry: BlogEntry): boolean {
  return isFieldNoteEntry(entry) && Boolean(entry.data.seriesSlug?.trim());
}

export function fieldNoteSlugFromEntry(entry: BlogEntry): string {
  const explicit = entry.data.fieldNoteSlug?.trim();
  if (explicit) return explicit;
  const id = entry.id;
  if (id.includes("/")) {
    const segment = id.split("/").pop();
    if (segment) return segment;
  }
  return id;
}

export function seriesSlugFromEntry(entry: BlogEntry): string | null {
  const slug = entry.data.seriesSlug?.trim();
  return slug && slug.length > 0 ? slug : null;
}

export function standaloneSlugFromEntry(entry: BlogEntry): string {
  return entry.id.includes("/") ? fieldNoteSlugFromEntry(entry) : entry.id;
}

export function seriesLandingPath(seriesSlug: string): string {
  return `/blog/${seriesSlug}/`;
}

export function seriesFieldNotePath(seriesSlug: string, noteSlug: string): string {
  return `/blog/${seriesSlug}/${noteSlug}/`;
}

export function seriesCheatSheetPath(seriesSlug: string): string {
  return `/blog/${seriesSlug}/cheat-sheet/`;
}

export function standaloneCheatSheetPath(noteSlug: string): string {
  return `/blog/${noteSlug}/cheat-sheet/`;
}

export function standaloneFieldNotePath(noteSlug: string): string {
  return `/blog/${noteSlug}/`;
}

export function filterPublished(entries: BlogEntry[]): BlogEntry[] {
  return entries.filter((e) => !e.data.draft);
}

export function getSeriesEntries(entries: BlogEntry[]): BlogEntry[] {
  return filterPublished(entries).filter(isSeriesEntry);
}

export function getStandaloneFieldNotes(entries: BlogEntry[]): BlogEntry[] {
  return filterPublished(entries).filter(isStandaloneFieldNote);
}

export function getSeriesFieldNotes(
  entries: BlogEntry[],
  seriesSlug: string,
): BlogEntry[] {
  return filterPublished(entries)
    .filter(
      (e) =>
        isSeriesFieldNote(e) && seriesSlugFromEntry(e) === seriesSlug,
    )
    .sort((a, b) => {
      const oa = a.data.order ?? Number.MAX_SAFE_INTEGER;
      const ob = b.data.order ?? Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return a.data.date.valueOf() - b.data.date.valueOf();
    });
}

export function findSeriesEntry(
  entries: BlogEntry[],
  seriesSlug: string,
): BlogEntry | undefined {
  return filterPublished(entries).find(
    (e) => isSeriesEntry(e) && seriesSlugFromEntry(e) === seriesSlug,
  );
}

export function findSeriesFieldNote(
  entries: BlogEntry[],
  seriesSlug: string,
  noteSlug: string,
): BlogEntry | undefined {
  return getSeriesFieldNotes(entries, seriesSlug).find(
    (e) => fieldNoteSlugFromEntry(e) === noteSlug,
  );
}

export function findStandaloneFieldNote(
  entries: BlogEntry[],
  slug: string,
): BlogEntry | undefined {
  return getStandaloneFieldNotes(entries).find(
    (e) => standaloneSlugFromEntry(e) === slug,
  );
}

export function findSeriesCheatSheet(
  entries: BlogEntry[],
  seriesSlug: string,
): BlogEntry | undefined {
  return filterPublished(entries).find(
    (e) =>
      isCheatSheetEntry(e) &&
      seriesSlugFromEntry(e) === seriesSlug &&
      !e.data.fieldNoteSlug?.trim(),
  );
}

export function findStandaloneCheatSheet(
  entries: BlogEntry[],
  noteSlug: string,
): BlogEntry | undefined {
  return filterPublished(entries).find(
    (e) =>
      isCheatSheetEntry(e) &&
      !e.data.seriesSlug?.trim() &&
      e.data.fieldNoteSlug?.trim() === noteSlug,
  );
}

export function seriesHasCheatSheet(
  entries: BlogEntry[],
  seriesSlug: string,
): boolean {
  const series = findSeriesEntry(entries, seriesSlug);
  if (series?.data.cheatSheetAvailable) return true;
  return Boolean(findSeriesCheatSheet(entries, seriesSlug));
}

export function standaloneHasCheatSheet(
  entries: BlogEntry[],
  noteSlug: string,
): boolean {
  const note = findStandaloneFieldNote(entries, noteSlug);
  if (note?.data.cheatSheetAvailable) return true;
  return Boolean(findStandaloneCheatSheet(entries, noteSlug));
}

export type BlogIndexSeriesCard = {
  kind: "series";
  seriesSlug: string;
  title: string;
  subtitle?: string;
  description: string;
  noteCount: number;
  cheatSheetAvailable: boolean;
  href: string;
  date: Date;
  topicChips: FieldNoteTopicChip[];
};

export type BlogIndexStandaloneCard = {
  kind: "standalone";
  slug: string;
  title: string;
  description: string;
  date: Date;
  categoryLabel: string;
  foundational: boolean;
  cheatSheetAvailable: boolean;
  href: string;
  topicChips: FieldNoteTopicChip[];
};

export type BlogIndexItem = BlogIndexSeriesCard | BlogIndexStandaloneCard;

/** Visual series marker: three vertical lines (Reading the Grip motif). */
export const FIELD_NOTE_SERIES_MARKER_LINES = 3;

/** Left stripe count on feed cards (1–3; meta line carries exact part count). */
export function fieldNoteSeriesStripeCount(noteCount: number): number {
  return Math.min(Math.max(noteCount, 1), 3);
}

function entrySortTime(entry: BlogEntry): number {
  return (entry.data.modifiedDate ?? entry.data.date).valueOf();
}

export function getIndividualFieldNotes(entries: BlogEntry[]): BlogEntry[] {
  return getStandaloneFieldNotes(entries).filter(
    (e) => !isFoundationalFieldNote(e),
  );
}

export function getFoundationalFieldNotes(entries: BlogEntry[]): BlogEntry[] {
  return getStandaloneFieldNotes(entries).filter(isFoundationalFieldNote);
}

export type FieldNoteLibraryLaneId = "series" | "individual" | "foundational";

export type FieldNoteLibraryLane = {
  id: FieldNoteLibraryLaneId;
  label: string;
  path: string;
  cardIntro: string;
  pageIntro: string;
};

export const FIELD_NOTE_LIBRARY_LANES: FieldNoteLibraryLane[] = [
  {
    id: "series",
    label: "Field Note Series",
    path: "/blog/library/series/",
    cardIntro:
      "Multi-part observational and practice-based series drawn from live reading work.",
    pageIntro:
      "Field Note Series follow one line of practice across several connected notes. They document real reading conditions, decisions, and interpretive structure as they unfolded.",
  },
  {
    id: "individual",
    label: "Individual Field Notes",
    path: "/blog/library/individual/",
    cardIntro:
      "Standalone notes from real interpretive work: one situation, one line of observation.",
    pageIntro:
      "Individual Field Notes are single pieces drawn from practice. They focus on what showed up in the reading field, not general instruction.",
  },
  {
    id: "foundational",
    label: "Foundational Field Notes",
    path: "/blog/library/foundational/",
    cardIntro:
      "Core orientation on perception, seeker dynamics, symbolic reading, and COMPASS-adjacent method.",
    pageIntro:
      "Foundational Field Notes orient readers to key Tides of Knowing concepts: how attention works in symbolic reading, how seekers arrive, and how methodology takes shape in practice.",
  },
];

export function libraryLanePath(laneId: FieldNoteLibraryLaneId): string {
  return `/blog/library/${laneId}/`;
}

/** @deprecated Use FieldNoteTopic from fieldNoteTopics.ts */
export type FieldNoteTopicFilter = FieldNoteTopic;

/** Topic pages and /blog/ navigation (canonical list). */
export const FIELD_NOTE_TOPIC_FILTERS = FIELD_NOTE_TOPICS;

/** Published blog entries used for topic matching (excludes cheat sheets). */
export function getTopicIndexEntries(entries: BlogEntry[]): BlogEntry[] {
  return filterPublished(entries).filter(
    (e) => isSeriesEntry(e) || isStandaloneFieldNote(e) || isSeriesFieldNote(e),
  );
}

export function entryMatchesTopicFilter(
  entry: BlogEntry,
  filter: FieldNoteTopicFilter,
): boolean {
  return entryMatchesFieldNoteTopic(entry, filter);
}

export function getActiveFieldNoteTopicFilters(
  entries: BlogEntry[],
): FieldNoteTopic[] {
  const indexEntries = getTopicIndexEntries(entries);
  return getIndexableFieldNoteTopicsWithContent(indexEntries);
}

/** Lowercase string for client-side Field Notes search on /blog/. */
export function fieldNoteFeedItemSearchHaystack(item: BlogIndexItem): string {
  const topicLabels = item.topicChips.map((c) => c.label).join(" ");
  const parts = [item.title, item.description, topicLabels];
  if (item.kind === "series" && item.subtitle) {
    parts.push(item.subtitle);
  }
  if (item.kind === "standalone") {
    parts.push(item.categoryLabel);
  }
  return parts.join(" ").toLowerCase().replace(/\s+/g, " ").trim();
}

function buildSeriesCards(
  published: BlogEntry[],
): BlogIndexSeriesCard[] {
  return getSeriesEntries(published).map((series) => {
    const seriesSlug = seriesSlugFromEntry(series)!;
    const notes = getSeriesFieldNotes(published, seriesSlug);
    return {
      kind: "series",
      seriesSlug,
      title: series.data.title,
      subtitle: series.data.subtitle,
      description: series.data.description ?? "",
      noteCount: notes.length,
      cheatSheetAvailable: seriesHasCheatSheet(published, seriesSlug),
      href: seriesLandingPath(seriesSlug),
      date: series.data.date,
      topicChips: topicChipsFromTags(series.data.tags),
    };
  });
}

function buildStandaloneCards(
  published: BlogEntry[],
  categoryLabelFn: (entry: BlogEntry) => string,
  source: BlogEntry[],
): BlogIndexStandaloneCard[] {
  return source.map((post) => {
    const slug = standaloneSlugFromEntry(post);
    return {
      kind: "standalone",
      slug,
      title: post.data.title,
      description: post.data.description ?? "",
      date: post.data.date,
      categoryLabel: categoryLabelFn(post),
      foundational: isFoundationalFieldNote(post),
      cheatSheetAvailable: standaloneHasCheatSheet(published, slug),
      href: standaloneFieldNotePath(slug),
      topicChips: topicChipsFromTags(post.data.tags),
    };
  });
}

export function buildBlogIndexItems(
  entries: BlogEntry[],
  categoryLabelFn: (entry: BlogEntry) => string,
): BlogIndexItem[] {
  const published = filterPublished(entries);
  const seriesCards = buildSeriesCards(published);
  const standaloneCards = buildStandaloneCards(
    published,
    categoryLabelFn,
    getStandaloneFieldNotes(published).sort(
      (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
    ),
  );

  return [...seriesCards, ...standaloneCards];
}

/** Chronological feed for the Field Notes hub (series and standalones interleaved). */
export function buildBlogFeedItems(
  entries: BlogEntry[],
  categoryLabelFn: (entry: BlogEntry) => string,
): BlogIndexItem[] {
  const published = filterPublished(entries);
  const seriesCards = buildSeriesCards(published);
  const standaloneCards = buildStandaloneCards(
    published,
    categoryLabelFn,
    getStandaloneFieldNotes(published),
  );

  const feedSortTime = (item: BlogIndexItem): number => {
    if (item.kind === "series") {
      const series = findSeriesEntry(published, item.seriesSlug);
      return series ? entrySortTime(series) : item.date.valueOf();
    }
    return (item as BlogIndexStandaloneCard).date.valueOf();
  };

  return [...seriesCards, ...standaloneCards].sort(
    (a, b) => feedSortTime(b) - feedSortTime(a),
  );
}

/** Feed items for a filtered set of collection entries (topic pages, lane pages). */
export function buildBlogFeedItemsFromEntries(
  matched: BlogEntry[],
  allEntries: BlogEntry[],
  categoryLabelFn: (entry: BlogEntry) => string,
): BlogIndexItem[] {
  const published = filterPublished(allEntries);
  const items: BlogIndexItem[] = [];

  for (const entry of matched) {
    if (isSeriesEntry(entry)) {
      const seriesSlug = seriesSlugFromEntry(entry)!;
      const notes = getSeriesFieldNotes(published, seriesSlug);
      items.push({
        kind: "series",
        seriesSlug,
        title: entry.data.title,
        subtitle: entry.data.subtitle,
        description: entry.data.description ?? "",
        noteCount: notes.length,
        cheatSheetAvailable: seriesHasCheatSheet(published, seriesSlug),
        href: seriesLandingPath(seriesSlug),
        date: entry.data.date,
        topicChips: topicChipsFromTags(entry.data.tags),
      });
    } else if (isStandaloneFieldNote(entry)) {
      const slug = standaloneSlugFromEntry(entry);
      items.push({
        kind: "standalone",
        slug,
        title: entry.data.title,
        description: entry.data.description ?? "",
        date: entry.data.date,
        categoryLabel: categoryLabelFn(entry),
        foundational: isFoundationalFieldNote(entry),
        cheatSheetAvailable: standaloneHasCheatSheet(published, slug),
        href: standaloneFieldNotePath(slug),
        topicChips: topicChipsFromTags(entry.data.tags),
      });
    } else if (isSeriesFieldNote(entry)) {
      const seriesSlug = seriesSlugFromEntry(entry)!;
      const noteSlug = fieldNoteSlugFromEntry(entry);
      items.push({
        kind: "standalone",
        slug: `${seriesSlug}/${noteSlug}`,
        title: entry.data.title,
        description: entry.data.description ?? "",
        date: entry.data.date,
        categoryLabel: categoryLabelFn(entry),
        foundational: false,
        cheatSheetAvailable: false,
        href: seriesFieldNotePath(seriesSlug, noteSlug),
        topicChips: topicChipsFromTags(entry.data.tags),
      });
    }
  }

  return items.sort((a, b) => {
    const da = a.kind === "series" ? a.date : a.date;
    const db = b.kind === "series" ? b.date : b.date;
    return db.valueOf() - da.valueOf();
  });
}

export function buildLaneFeedItems(
  entries: BlogEntry[],
  laneId: FieldNoteLibraryLaneId,
  categoryLabelFn: (entry: BlogEntry) => string,
): BlogIndexItem[] {
  const published = filterPublished(entries);

  if (laneId === "series") {
    return buildSeriesCards(published).sort(
      (a, b) => b.date.valueOf() - a.date.valueOf(),
    );
  }

  const source =
    laneId === "individual"
      ? getIndividualFieldNotes(published)
      : getFoundationalFieldNotes(published);

  return buildStandaloneCards(
    published,
    categoryLabelFn,
    [...source].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()),
  );
}

export function latestFeedItemInLane(
  items: BlogIndexItem[],
  laneId: FieldNoteLibraryLaneId,
): BlogIndexItem | undefined {
  const filtered = items.filter((item) => {
    if (laneId === "series") return item.kind === "series";
    if (laneId === "foundational")
      return item.kind === "standalone" && item.foundational;
    return item.kind === "standalone" && !item.foundational;
  });
  if (filtered.length === 0) return undefined;
  return filtered.sort((a, b) => {
    const da = a.kind === "series" ? a.date : a.date;
    const db = b.kind === "series" ? b.date : b.date;
    return db.valueOf() - da.valueOf();
  })[0];
}
