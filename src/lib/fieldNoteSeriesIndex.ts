import type { CollectionEntry } from "astro:content";
import {
  getSeriesEntries,
  getSeriesFieldNotes,
  seriesHasCheatSheet,
  seriesLandingPath,
  seriesSlugFromEntry,
} from "./blogFieldNotes";

type BlogEntry = CollectionEntry<"blog">;

export const FIELD_NOTE_SERIES_HUB_PATH = "/blog/series/";

export type FieldNoteSeriesIndexRow = {
  seriesSlug: string;
  title: string;
  description: string;
  noteCount: number;
  seriesPageHref: string;
  cheatSheetAvailable: boolean;
};

/** Rows for /blog/series/ (Field Note series only). */
export function getFieldNoteSeriesIndexRows(
  entries: BlogEntry[],
): FieldNoteSeriesIndexRow[] {
  const published = getSeriesEntries(entries);
  return published
    .map((series) => {
      const seriesSlug = seriesSlugFromEntry(series);
      if (!seriesSlug) return null;
      const notes = getSeriesFieldNotes(entries, seriesSlug);
      return {
        seriesSlug,
        title: series.data.title,
        description: series.data.description ?? "",
        noteCount: notes.length,
        seriesPageHref: seriesLandingPath(seriesSlug),
        cheatSheetAvailable: seriesHasCheatSheet(entries, seriesSlug),
      };
    })
    .filter((row): row is FieldNoteSeriesIndexRow => row !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}
