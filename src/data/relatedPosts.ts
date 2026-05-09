/** Manual related-reading links keyed by Field Notes slug (`/blog/...`). Add entries as you publish posts. */
export type RelatedLink = { title: string; href: string };

export const relatedReadingBySlug: Record<string, RelatedLink[]> = {
  // "example-slug": [{ title: "Another piece", href: "/blog/other-slug" }],
};

export function getRelatedForSlug(slug: string): RelatedLink[] {
  return relatedReadingBySlug[slug] ?? [];
}
