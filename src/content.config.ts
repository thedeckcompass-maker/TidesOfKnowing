import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  articlesSchema,
  blogSchema,
  recentClientReadingsSchema,
  repeatingCardMeaningsSchema,
} from "./content/config";

/** Field Notes markdown root only (`content-intake/blog` is never loaded here). */
const blogBase = new URL("./content/blog/", import.meta.url);
const articlesBase = new URL("./content/articles/", import.meta.url);
const repeatingCardMeaningsBase = new URL(
  "./content/repeating-card-meanings/",
  import.meta.url,
);
const recentClientReadingsBase = new URL(
  "./content/recent-client-readings/",
  import.meta.url,
);

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: blogBase,
    /**
     * Stable ids from relative paths (e.g. `my-series/note-one`, `welcome-to-tides-of-knowing`).
     * Enables nested series folders without stem collisions.
     */
    generateId: ({ entry }) => entry.replace(/\.md$/i, "").replace(/\\/g, "/"),
  }),
  schema: blogSchema,
});

const articles = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: articlesBase,
    /**
     * Stable ids from filenames (e.g. `how-to-live-with-spiritual-longing`).
     * Do not use frontmatter `slug` for ids — Astro's glob loader treats `slug`
     * as an id override, which duplicates the path-derived id when they match.
     * Public URLs continue to use `entry.data.slug`.
     */
    generateId: ({ entry }) => entry.replace(/\.md$/i, "").replace(/\\/g, "/"),
  }),
  schema: articlesSchema,
});

/** Suit subfolders for card entries (add new suits here when content is ready). */
const repeatingCardSuitPattern = "{majors,cups,swords,wands,pentacles}";

const repeatingCardMeanings = defineCollection({
  loader: glob({
    pattern: `${repeatingCardSuitPattern}/*.md`,
    base: repeatingCardMeaningsBase,
    /** Stable ids: `majors/the-fool`, `cups/ace-of-cups`, etc. */
    generateId: ({ entry }) => entry.replace(/\.md$/i, "").replace(/\\/g, "/"),
  }),
  schema: repeatingCardMeaningsSchema,
});

const recentClientReadings = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: recentClientReadingsBase,
    generateId: ({ entry }) => entry.replace(/\.md$/i, "").replace(/\\/g, "/"),
  }),
  schema: recentClientReadingsSchema,
});

export const collections = { blog, articles, repeatingCardMeanings, recentClientReadings };
