import type { CollectionEntry } from "astro:content";

export type BlogEntry = CollectionEntry<"blog">;
export type BlogEntryType = BlogEntry["data"]["type"];

const FIELD_NOTES_DEFINITION =
  "Field Notes on Tides of Knowing document real practice — anonymised where necessary, reflective always. They are not theory. They are the work, observed closely.";

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
};

export type BlogIndexItem = BlogIndexSeriesCard | BlogIndexStandaloneCard;

export function buildBlogIndexItems(
  entries: BlogEntry[],
  categoryLabelFn: (entry: BlogEntry) => string,
): BlogIndexItem[] {
  const published = filterPublished(entries);
  const seriesCards: BlogIndexSeriesCard[] = getSeriesEntries(published).map(
    (series) => {
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
      };
    },
  );

  const standaloneCards: BlogIndexStandaloneCard[] = getStandaloneFieldNotes(
    published,
  )
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((post) => {
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
      };
    });

  return [...seriesCards, ...standaloneCards];
}
