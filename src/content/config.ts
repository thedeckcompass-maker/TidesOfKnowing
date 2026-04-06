import { z } from "astro:content";

/** Blog post frontmatter — used by `src/content.config.ts`. */
export const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
  heroImage: z.string().optional(),
  heroImageAlt: z.string().optional(),
  heroCaption: z.string().optional(),
  readingTime: z.number().optional(),
  featured: z.boolean().default(false),
});

/** Long-form articles under `/articles/[slug]/` — used by `src/content.config.ts`. */
export const articlesSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  slug: z.string(),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  seriesName: z.string().optional(),
  seriesOrder: z.number().optional(),
  seriesTotal: z.number().optional(),
  previousArticle: z.string().nullable().optional(),
  nextArticle: z.string().nullable().optional(),
  heroImage: z.string(),
  heroImageAlt: z.string(),
  excerpt: z.string(),
  tags: z.array(z.string()),
  author: z.string().default("Leigh Spencer"),
  readingTime: z.number().optional(),
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).optional(),
});
