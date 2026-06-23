import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { getCollection } from "astro:content";
import { communityEnv } from "../lib/community/env";
import { totalCommunityPages } from "../lib/community/pagination";
import { slugify } from "../utils/slugify";
import { blogCategoryIndex } from "../lib/blogCategories";
import { getIndexableArticleTopicsWithContent } from "../lib/articleLibraryNav";
import {
  ARTICLE_TOPICS_HUB_ENABLED,
  ARTICLE_TOPICS_HUB_PATH,
  articleTopicFilterPath,
  getArticleTopicIndexRows,
} from "../data/articleTopics";
import {
  ARTICLE_SERIES_HUB_PATH,
  getArticleSeriesIndexRows,
} from "../lib/articleSeriesIndex";
import {
  FIELD_NOTE_LIBRARY_LANES,
  fieldNoteSlugFromEntry,
  getIndexableFieldNoteTopicsWithContent,
  getSeriesEntries,
  getSeriesFieldNotes,
  getStandaloneFieldNotes,
  getTopicIndexEntries,
  seriesSlugFromEntry,
  standaloneSlugFromEntry,
  topicFilterPath,
} from "../lib/blogFieldNotes";
import {
  FIELD_NOTE_TOPICS_HUB_ENABLED,
  FIELD_NOTE_TOPICS_HUB_PATH,
  getFieldNoteTopicIndexRows,
} from "../data/fieldNoteTopics";
import {
  FIELD_NOTE_SERIES_HUB_PATH,
  getFieldNoteSeriesIndexRows,
} from "../lib/fieldNoteSeriesIndex";
import { LIBRARY_PER_PAGE, totalPages } from "../lib/libraryPagination";
import { libraryListPath, type LibraryListMode } from "../lib/libraryPageUrls";
import { isRepeatingMeaningReady } from "../lib/repeatingCardMeanings";
import {
  getRepeatingCardCanonicalPath,
  getRepeatingCardHubPath,
  getRepeatingCardSeoHubPath,
} from "../lib/repeatingCardUrls";

export const prerender = false;

const SITE = "https://www.tidesofknowing.com";

type Row = { path: string; changefreq: string; priority: string; lastmod?: string };

function toSitemapLastmod(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseOptionalIsoDate(value: string | undefined): Date | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/** Latest valid date as W3C date (YYYY-MM-DD); omit when no dates supplied. */
function lastmodFromDates(...dates: (Date | undefined)[]): string | undefined {
  const valid = dates.filter(
    (d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()),
  );
  if (valid.length === 0) return undefined;
  const latest = valid.reduce((max, d) => (d > max ? d : max));
  return toSitemapLastmod(latest);
}

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

export const GET: APIRoute = async ({ locals }) => {
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
  /** Tools directory hub (live + coming-soon tools); not individual tool deep-links. */
  rows.push({ path: "/tools/", changefreq: "monthly", priority: "0.7" });
  rows.push({ path: "/community/", changefreq: "weekly", priority: "0.72" });
  rows.push({
    path: "/resources/discernment-checklist/",
    changefreq: "monthly",
    priority: "0.62",
  });
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
    const priority = a.data.slug === "compass-method" ? "0.85" : "0.7";
    rows.push({
      path: `/articles/${a.data.slug}/`,
      changefreq: "monthly",
      priority,
      lastmod: lastmodFromDates(a.data.updatedDate, a.data.publishDate),
    });
  }

  const tagSlugs = new Set(
    articles.flatMap((a) => a.data.tags.map((t) => slugify(t))),
  );
  for (const t of tagSlugs) {
    rows.push({ path: `/tags/${t}/`, changefreq: "monthly", priority: "0.6" });
  }

  const topicIndexRows = getArticleTopicIndexRows(articles);
  if (ARTICLE_TOPICS_HUB_ENABLED && topicIndexRows.length > 0) {
    rows.push({
      path: ARTICLE_TOPICS_HUB_PATH,
      changefreq: "monthly",
      priority: "0.68",
    });
  }

  for (const topic of getIndexableArticleTopicsWithContent(articles)) {
    rows.push({
      path: articleTopicFilterPath(topic.slug),
      changefreq: "monthly",
      priority: "0.62",
    });
  }

  const seriesIndexRows = getArticleSeriesIndexRows(articles);
  if (seriesIndexRows.length > 0) {
    rows.push({
      path: ARTICLE_SERIES_HUB_PATH,
      changefreq: "monthly",
      priority: "0.68",
    });
  }

  /** Interactive tool hub (not individual tool deep-links). */
  rows.push({
    path: getRepeatingCardHubPath(),
    changefreq: "monthly",
    priority: "0.76",
  });

  /** SEO/AEO cluster hub for canonical entity pages. */
  rows.push({
    path: getRepeatingCardSeoHubPath(),
    changefreq: "weekly",
    priority: "0.88",
  });

  /** Canonical entity card pages (`/repeating-card-meanings/{slug}/`). */
  const repeatingCards = await getCollection("repeatingCardMeanings");
  for (const entry of repeatingCards) {
    if (!isRepeatingMeaningReady(entry)) continue;
    rows.push({
      path: getRepeatingCardCanonicalPath(entry),
      changefreq: "monthly",
      priority: "0.78",
      lastmod: lastmodFromDates(
        parseOptionalIsoDate(entry.data.dateModified),
        parseOptionalIsoDate(entry.data.datePublished),
      ),
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

  for (const lane of FIELD_NOTE_LIBRARY_LANES) {
    rows.push({
      path: lane.path,
      changefreq: "weekly",
      priority: "0.62",
    });
  }

  const fnTopicIndexEntries = getTopicIndexEntries(blog);
  const fnTopicRows = getFieldNoteTopicIndexRows(fnTopicIndexEntries);
  if (FIELD_NOTE_TOPICS_HUB_ENABLED && fnTopicRows.length > 0) {
    rows.push({
      path: FIELD_NOTE_TOPICS_HUB_PATH,
      changefreq: "weekly",
      priority: "0.64",
    });
  }

  for (const topic of getIndexableFieldNoteTopicsWithContent(fnTopicIndexEntries)) {
    rows.push({
      path: topicFilterPath(topic.slug),
      changefreq: "weekly",
      priority: "0.58",
    });
  }

  const fnSeriesRows = getFieldNoteSeriesIndexRows(blog);
  if (fnSeriesRows.length > 0) {
    rows.push({
      path: FIELD_NOTE_SERIES_HUB_PATH,
      changefreq: "weekly",
      priority: "0.64",
    });
  }

  for (const post of standaloneBlog) {
    const slug = standaloneSlugFromEntry(post);
    rows.push({
      path: `/blog/${slug}/`,
      changefreq: "monthly",
      priority: "0.65",
      lastmod: lastmodFromDates(post.data.modifiedDate, post.data.date),
    });
  }

  for (const series of getSeriesEntries(blog)) {
    const seriesSlug = seriesSlugFromEntry(series);
    if (!seriesSlug) continue;
    rows.push({
      path: `/blog/${seriesSlug}/`,
      changefreq: "monthly",
      priority: "0.68",
      lastmod: lastmodFromDates(series.data.modifiedDate, series.data.date),
    });
    for (const note of getSeriesFieldNotes(blog, seriesSlug)) {
      const noteSlug = fieldNoteSlugFromEntry(note);
      rows.push({
        path: `/blog/${seriesSlug}/${noteSlug}/`,
        changefreq: "monthly",
        priority: "0.64",
        lastmod: lastmodFromDates(note.data.modifiedDate, note.data.date),
      });
    }
  }

  const env = communityEnv(locals);
  if (env.supabaseUrl && env.supabaseAnonKey) {
    const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { count: communityPostCount } = await supabase
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    const communityPages = totalCommunityPages(communityPostCount ?? 0);
    for (let page = 2; page <= communityPages; page++) {
      rows.push({
        path: `/community/page/${page}/`,
        changefreq: "weekly",
        priority: "0.58",
      });
    }

    const { data: sections } = await supabase
      .from("community_sections")
      .select("key")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    for (const section of (sections ?? []) as { key: string }[]) {
      rows.push({
        path: `/community/sections/${section.key}/`,
        changefreq: "weekly",
        priority: "0.68",
      });

      const { count: sectionPostCount } = await supabase
        .from("community_posts")
        .select("id, community_sections!inner(key)", { count: "exact", head: true })
        .eq("status", "published")
        .eq("community_sections.key", section.key);
      const sectionPages = totalCommunityPages(sectionPostCount ?? 0);
      for (let page = 2; page <= sectionPages; page++) {
        rows.push({
          path: `/community/sections/${section.key}/page/${page}/`,
          changefreq: "weekly",
          priority: "0.55",
        });
      }
    }

    const { data: communityPosts } = await supabase
      .from("community_posts")
      .select("slug, updated_at, created_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(1000);
    for (const post of (communityPosts ?? []) as {
      slug: string;
      updated_at?: string;
      created_at?: string;
    }[]) {
      rows.push({
        path: `/community/${post.slug}/`,
        changefreq: "monthly",
        priority: "0.64",
        lastmod: lastmodFromDates(
          parseOptionalIsoDate(post.updated_at),
          parseOptionalIsoDate(post.created_at),
        ),
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
      const lastmodTag = r.lastmod
        ? `<lastmod>${xmlEscape(r.lastmod)}</lastmod>`
        : "";
      return [
        "<url>",
        `<loc>${loc}</loc>`,
        lastmodTag,
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
