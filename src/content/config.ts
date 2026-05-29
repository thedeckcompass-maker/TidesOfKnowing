import { z } from "astro:content";
import { furtherReadingSchema } from "../lib/furtherReading";

const blogSeoFields = z.object({
  /** Overrides `<title>` when set. */
  metaTitle: z.string().optional(),
  /** Overrides meta description when set. */
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  /** Open Graph / Twitter image (absolute or site-root path). Falls back to `heroImage`. */
  ogImage: z.string().optional(),
});

const blogDates = z.object({
  /** Published date (required for series and field notes). */
  date: z.coerce.date(),
  /** Last modified; falls back to `date` in templates when omitted. */
  modifiedDate: z.coerce.date().optional(),
});

/**
 * Field Notes collection (`blog`): supports standalone posts, series, nested notes, and cheat sheets.
 * Omit `type` on legacy posts; they are treated as standalone field notes.
 */
export const blogSchema = z
  .object({
    type: z.enum(["series", "field-note", "cheat-sheet"]).default("field-note"),
    title: z.string(),
    /** Short summary / meta description (required for series and field notes). */
    description: z.string().optional(),
    subtitle: z.string().optional(),
    /** URL segment for a series landing page (`/blog/[seriesSlug]/`). */
    seriesSlug: z.string().optional(),
    /**
     * URL segment for a note inside a series (`/blog/[seriesSlug]/[fieldNoteSlug]/`).
     * When omitted, derived from the markdown file name in a series folder.
     */
    fieldNoteSlug: z.string().optional(),
    /** Order within a series (lower first). */
    order: z.number().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    cheatSheetAvailable: z.boolean().default(false),
    /** Optional one-line positioning line (series field notes). */
    positioningSentence: z.string().optional(),
    /** Cheat sheet blocks (optional; body markdown may also carry steps). */
    corePrinciple: z.string().optional(),
    distinction: z.string().optional(),
    cheatSheetFooter: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    readingTime: z.number().optional(),
    featured: z.boolean().default(false),
    /** Standalone archive notes: slower, conceptual Field Notes (not series or practitioner walkthroughs). */
    fieldNoteKind: z.enum(["foundational"]).optional(),
    /** Optional compact direct answer (40–70 words) for AEO; rendered when set. */
    shortAnswer: z.string().optional(),
    furtherReading: furtherReadingSchema,
  })
  .merge(blogSeoFields)
  .merge(blogDates)
  .superRefine((data, ctx) => {
    if (data.type === "series") {
      if (!data.seriesSlug?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "seriesSlug is required when type is series",
          path: ["seriesSlug"],
        });
      }
      if (!data.description?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "description is required when type is series",
          path: ["description"],
        });
      }
    }
    if (data.type === "field-note") {
      if (!data.description?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "description is required when type is field-note",
          path: ["description"],
        });
      }
    }
    if (data.type === "cheat-sheet") {
      const hasSeries = Boolean(data.seriesSlug?.trim());
      const hasParent = Boolean(data.fieldNoteSlug?.trim());
      if (!hasSeries && !hasParent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "cheat-sheet requires seriesSlug (series cheat sheet) or fieldNoteSlug (standalone note cheat sheet)",
          path: ["seriesSlug"],
        });
      }
    }
  });

/** Long-form articles under `/articles/[slug]/`: used by `src/content.config.ts`. */
export const articlesSchema = z.object({
  title: z.string(),
  /** Overrides `<title>` and default Open Graph title when set. */
  metaTitle: z.string().optional(),
  /** Overrides meta description and default Open Graph description when set. */
  metaDescription: z.string().optional(),
  subtitle: z.string().optional(),
  slug: z.string(),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  seriesName: z.string().optional(),
  /** Optional gold badge on library cards when the piece is not part of a series (e.g. Method hub). */
  listBadge: z.string().optional(),
  seriesOrder: z.number().optional(),
  seriesTotal: z.number().optional(),
  previousArticle: z.string().nullable().optional(),
  nextArticle: z.string().nullable().optional(),
  heroImage: z.string(),
  heroImageAlt: z.string(),
  heroImageFit: z.enum(["cover", "contain"]).optional(),
  excerpt: z.string(),
  tags: z.array(z.string()),
  author: z.string().default("Leigh Spencer"),
  readingTime: z.number().optional(),
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).optional(),
  /**
   * Optional author-read audio. Omit entirely when no recording exists.
   * `src` is optional if the default file exists at `public/audio/articles/[slug]/article.mp3`.
   */
  audio: z
    .object({
      src: z.string().optional(),
      duration: z.string().optional(),
      transcript: z.string().optional(),
    })
    .optional(),
  /** Optional compact direct answer (40–70 words) for AEO; rendered when set. */
  shortAnswer: z.string().optional(),
  furtherReading: furtherReadingSchema,
});

/**
 * Repeating card meaning entries under suit folders:
 * `content/repeating-card-meanings/{majors,cups,swords,wands,pentacles}/`.
 * Framework and memory docs live outside these folders and are not collected.
 */
export const repeatingCardMeaningsSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  arcana: z.string(),
  suit: z.string(),
  card_number: z.string(),
  tier: z.string().optional(),
  status: z.string().optional(),
  /** When false, the tool shows a preparing state even if a file exists. */
  ready: z.boolean().optional(),
  /** Conversational panel summary for the tool header (distinct from body pull quote). */
  summary: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  /** SEO primary phrase; populated from card-metadata-map during rollout. */
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).default([]),
  /** Short answer block for featured snippets and answer engines. */
  featuredSnippetAnswer: z.string().optional(),
  answerEngineSummary: z.string().optional(),
  /** Path-only canonical override; default is `/repeating-card-meanings/{card-slug}/`. */
  canonicalUrl: z.string().optional(),
  /** Path under public/, e.g. `/images/tarot/rws/the-fool.jpg`. */
  openGraphImage: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  themes: z.array(z.string()).default([]),
  life_areas: z.array(z.string()).default([]),
  seeker_states: z.array(z.string()).default([]),
  compass_pillars: z.array(z.string()).default([]),
  related_cards: z.array(z.string()).default([]),
  related_articles: z.array(z.string()).default([]),
});
