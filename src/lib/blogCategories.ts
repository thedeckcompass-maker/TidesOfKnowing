import { slugify } from "../utils/slugify";

export const DEFAULT_BLOG_CATEGORY = "Journal";

export function blogCategoryLabel(post: { data: { category?: string } }): string {
  const c = post.data.category?.trim();
  return c && c.length > 0 ? c : DEFAULT_BLOG_CATEGORY;
}

export function blogCategorySlugFromLabel(label: string): string {
  return slugify(label);
}

export type BlogCategoryRow = { label: string; slug: string; count: number };

export function blogCategoryIndex<T extends { data: { category?: string } }>(
  posts: T[],
): BlogCategoryRow[] {
  const bySlug = new Map<string, { label: string; count: number }>();
  for (const p of posts) {
    const label = blogCategoryLabel(p);
    const slug = blogCategorySlugFromLabel(label);
    const cur = bySlug.get(slug);
    if (cur) cur.count += 1;
    else bySlug.set(slug, { label, count: 1 });
  }
  return [...bySlug.entries()]
    .map(([slug, { label, count }]) => ({ slug, label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
