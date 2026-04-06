/**
 * Blog listing order: featured posts first (newest among featured), then
 * non-featured (newest first).
 */
export function sortBlogPostsForListing<
  T extends { data: { featured?: boolean; date: Date } },
>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const fa = a.data.featured ? 1 : 0;
    const fb = b.data.featured ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });
}
