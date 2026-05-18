import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { slugify } from "../utils/slugify";
import { blogCategoryIndex } from "../lib/blogCategories";
import {
  fieldNoteSlugFromEntry,
  getSeriesEntries,
  getSeriesFieldNotes,
  getStandaloneFieldNotes,
  seriesSlugFromEntry,
  standaloneSlugFromEntry,
} from "../lib/blogFieldNotes";
import { LIBRARY_PER_PAGE, totalPages } from "../lib/libraryPagination";
import { libraryListPath, type LibraryListMode } from "../lib/libraryPageUrls";
import { isRepeatingMeaningReady } from "../lib/repeatingCardMeanings";
import {
  getRepeatingCardCanonicalPath,
  getRepeatingCardHubPath,
  getRepeatingCardSeoHubPath,
} from "../lib/repeatingCardUrls";

export const prerender = true;

const SITE = "https://www.tidesofknowing.com";

type Row = { path: string; changefreq: string; priority: string };

function absPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = SITE.replace(/\/$/, "");
  return base + p;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addPages(
  rows: Row[],
  mode: LibraryListMode,
  count: number,
  priorityFirst: string,
  priorityRest: string,
  changefreq: string,
) {
  const tp = totalPages(count, LIBRARY_PER_PAGE);
  for (let p = 1; p <= tp; p++) {
    const path = libraryListPath(mode, p);
    const priority = p === 1 ? priorityFirst : priorityRest;
    rows.push({ path, changefreq, priority });
  }
}

export const GET: APIRoute = async () => {
  const articles = await getCollection("articles");
  /** Field Notes: Astro collection id `blog`; sitemap paths stay `/blog/...` for compatibility. */
  const blog = await getCollection("blog", ({ data }) => !data.draft);

  const rows: Row[] = [];

  rows.push({ path: "/", changefreq: "weekly", priority: "1.0" });
  rows.push({ path: "/about/", changefreq: "monthly", priority: "0.8" });
  /** /subscribe/ is noindex (parameterised attribution URLs); omit from sitemap. */
  rows.push({
    path: "/ai-and-intuition-field-guide/",
    changefreq: "monthly",
    priority: "0.72",
  });
  rows.push({ path: "/blog/", changefreq: "weekly", priority: "0.7" });
  rows.push({ path: "/series/", changefreq: "monthly", priority: "0.75" });
  rows.push({ path: "/tags/", changefreq: "monthly", priority: "0.65" });

  addPages(rows, { kind: "newest" }, articles.length, "0.9", "0.5", "weekly");
  addPages(rows, { kind: "oldest" }, articles.length, "0.5", "0.5", "monthly");
  addPages(rows, { kind: "series" }, articles.length, "0.5", "0.5", "monthly");

  const bySeries = new Map<string, typeof articles>();
  for (const a of articles) {
    const n = a.data.seriesName;
    if (!n) continue;
    const s = slugify(n);
    const list = bySeries.get(s) ?? [];
    list.push(a);
    bySeries.set(s, list);
  }

  for (const [seriesSlug, list] of bySeries) {
    addPages(
      rows,
      { kind: "filter", seriesSlug },
      list.length,
      "0.55",
      "0.5",
      "monthly",
    );
    rows.push({
      path: `/series/${seriesSlug}/`,
      changefreq: "monthly",
      priority: "0.8",
    });
  }

  for (const a of articles) {
    rows.push({
      path: `/articles/${a.data.slug}/`,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  const tagSlugs = new Set(
    articles.flatMap((a) => a.data.tags.map((t) => slugify(t))),
  );
  for (const t of tagSlugs) {
    rows.push({ path: `/tags/${t}/`, changefreq: "monthly", priority: "0.6" });
  }

  /** Interactive tool hub (not individual tool deep-links). */
  rows.push({
    path: getRepeatingCardHubPath(),
    changefreq: "monthly",
    priority: "0.75",
  });

  /** SEO/AEO cluster hub for canonical entity pages. */
  rows.push({
    path: getRepeatingCardSeoHubPath(),
    changefreq: "monthly",
    priority: "0.8",
  });

  /** Canonical entity card pages (`/repeating-card-meanings/{slug}/`). */
  const repeatingCards = await getCollection("repeatingCardMeanings");
  for (const entry of repeatingCards) {
    if (!isRepeatingMeaningReady(entry)) continue;
    rows.push({
      path: getRepeatingCardCanonicalPath(entry),
      changefreq: "monthly",
      priority: "0.72",
    });
  }

  const standaloneBlog = getStandaloneFieldNotes(blog);

  for (const c of blogCategoryIndex(standaloneBlog)) {
    rows.push({
      path: `/blog/category/${c.slug}/`,
      changefreq: "weekly",
      priority: "0.55",
    });
  }

  for (const post of standaloneBlog) {
    const slug = standaloneSlugFromEntry(post);
    rows.push({
      path: `/blog/${slug}/`,
      changefreq: "monthly",
      priority: "0.65",
    });
  }

  for (const series of getSeriesEntries(blog)) {
    const seriesSlug = seriesSlugFromEntry(series);
    if (!seriesSlug) continue;
    rows.push({
      path: `/blog/${seriesSlug}/`,
      changefreq: "monthly",
      priority: "0.68",
    });
    for (const note of getSeriesFieldNotes(blog, seriesSlug)) {
      const noteSlug = fieldNoteSlugFromEntry(note);
      rows.push({
        path: `/blog/${seriesSlug}/${noteSlug}/`,
        changefreq: "monthly",
        priority: "0.64",
      });
    }
  }

  const seen = new Map<string, Row>();
  for (const r of rows) {
    const key = r.path;
    const prev = seen.get(key);
    if (!prev || Number.parseFloat(r.priority) > Number.parseFloat(prev.priority)) {
      seen.set(key, r);
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...seen.values()].map((r) => {
      const loc = xmlEscape(absPath(r.path));
      return [
        "<url>",
        `<loc>${loc}</loc>`,
        `<changefreq>${r.changefreq}</changefreq>`,
        `<priority>${r.priority}</priority>`,
        "</url>",
      ].join("");
    }),
    "</urlset>",
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
