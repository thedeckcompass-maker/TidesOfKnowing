import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { articlesSchema, blogSchema } from "./content/config";

/** Field Notes markdown root only (`content-intake/blog` is never loaded here). */
const blogBase = new URL("./content/blog/", import.meta.url);
const articlesBase = new URL("./content/articles/", import.meta.url);

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
  loader: glob({ pattern: "**/*.md", base: articlesBase }),
  schema: articlesSchema,
});

export const collections = { blog, articles };
