import { z } from "astro:content";

export const furtherReadingItemSchema = z.object({
  title: z.string(),
  href: z.string(),
  /** When true, renders with external link affordance (rel noopener). */
  external: z.boolean().optional(),
});

export const furtherReadingSchema = z.array(furtherReadingItemSchema).optional();

export type FurtherReadingItem = z.infer<typeof furtherReadingItemSchema>;
