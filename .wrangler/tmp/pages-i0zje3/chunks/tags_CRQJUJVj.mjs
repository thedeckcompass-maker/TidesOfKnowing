globalThis.process ??= {}; globalThis.process.env ??= {};
import { s as slugify } from './slugify_CFEDbR9M.mjs';

function tagsFromArticles(articles) {
  const map = /* @__PURE__ */ new Map();
  for (const a of articles) {
    for (const t of a.data.tags) {
      const s = slugify(t);
      const cur = map.get(s);
      if (!cur) map.set(s, { label: t, count: 1 });
      else cur.count += 1;
    }
  }
  return [...map.entries()].map(([slug, v]) => ({ slug, label: v.label, count: v.count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
function articlesWithTagSlug(articles, tagSlug) {
  return articles.filter(
    (a) => a.data.tags.some((t) => slugify(t) === tagSlug)
  );
}

export { articlesWithTagSlug as a, tagsFromArticles as t };
