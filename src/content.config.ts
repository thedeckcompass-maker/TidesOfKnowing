import { basename } from "node:path";
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
    /** One id per file stem; avoids glob-loader duplicate-id noise if paths vary by separator. */
    generateId: ({ entry }) => basename(entry, ".md"),
  }),
  schema: blogSchema,
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: articlesBase }),
  schema: articlesSchema,
});

export const collections = { blog, articles };
