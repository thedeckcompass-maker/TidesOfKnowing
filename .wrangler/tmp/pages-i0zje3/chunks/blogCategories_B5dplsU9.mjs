globalThis.process ??= {}; globalThis.process.env ??= {};
import { s as slugify } from './slugify_CFEDbR9M.mjs';

const DEFAULT_BLOG_CATEGORY_DISPLAY = "Field Notes";
const DEFAULT_BLOG_CATEGORY_SLUG = "journal";
function blogCategoryLabel(post) {
  const c = post.data.category?.trim();
  return c && c.length > 0 ? c : DEFAULT_BLOG_CATEGORY_DISPLAY;
}
function blogCategorySlugFromLabel(label) {
  if (label === DEFAULT_BLOG_CATEGORY_DISPLAY) return DEFAULT_BLOG_CATEGORY_SLUG;
  return slugify(label);
}
function blogCategoryIndex(posts) {
  const bySlug = /* @__PURE__ */ new Map();
  for (const p of posts) {
    const label = blogCategoryLabel(p);
    const slug = blogCategorySlugFromLabel(label);
    const cur = bySlug.get(slug);
    if (cur) cur.count += 1;
    else bySlug.set(slug, { label, count: 1 });
  }
  return [...bySlug.entries()].map(([slug, { label, count }]) => ({ slug, label, count })).sort((a, b) => a.label.localeCompare(b.label));
}

export { blogCategorySlugFromLabel as a, blogCategoryIndex as b, blogCategoryLabel as c };
