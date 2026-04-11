import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { slugify } from "../utils/slugify";
import { LIBRARY_PER_PAGE, totalPages } from "../lib/libraryPagination";
import { libraryListPath, type LibraryListMode } from "../lib/libraryPageUrls";

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
  const blog = await getCollection("blog", ({ data }) => !data.draft);

  const rows: Row[] = [];

  rows.push({ path: "/", changefreq: "weekly", priority: "1.0" });
  rows.push({ path: "/about/", changefreq: "monthly", priority: "0.8" });
  rows.push({ path: "/subscribe/", changefreq: "weekly", priority: "0.75" });
  rows.push({ path: "/library/", changefreq: "weekly", priority: "0.65" });
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

  for (const post of blog) {
    const slug = post.slug ?? post.id;
    rows.push({
      path: `/blog/${slug}/`,
      changefreq: "monthly",
      priority: "0.65",
    });
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
