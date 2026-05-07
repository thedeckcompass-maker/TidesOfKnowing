import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { articlesSchema, blogSchema } from "./content/config";

const blogBase = new URL("./content/blog/", import.meta.url);
const articlesBase = new URL("./content/articles/", import.meta.url);

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: blogBase }),
  schema: blogSchema,
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: articlesBase }),
  schema: articlesSchema,
});

export const collections = { blog, articles };
