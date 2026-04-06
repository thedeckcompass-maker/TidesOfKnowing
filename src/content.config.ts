import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { articlesSchema, blogSchema } from "./content/config";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: blogSchema,
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: articlesSchema,
});

export const collections = { blog, articles };
