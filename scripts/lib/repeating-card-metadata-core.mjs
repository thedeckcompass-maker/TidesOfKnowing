import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

export const ROOT = path.resolve(import.meta.dirname, "../..");
export const METADATA_MAP_PATH = path.join(
  ROOT,
  "src/content/repeating-card-meanings/seo-aeo-output/04-metadata/card-metadata-map.yaml",
);
export const CONTENT_ROOT = path.join(ROOT, "src/content/repeating-card-meanings");
export const PUBLIC_RWS_DIR = path.join(ROOT, "public/images/tarot/rws");
export const SITE_ORIGIN = "https://www.tidesofknowing.com";

export const SUIT_FOLDERS = ["majors", "cups", "swords", "wands", "pentacles"];

/** Optional SEO fields the Astro schema accepts for backfill. */
export const BACKFILL_FIELDS = [
  "primaryKeyword",
  "secondaryKeywords",
  "featuredSnippetAnswer",
  "answerEngineSummary",
  "canonicalUrl",
  "openGraphImage",
  "datePublished",
  "dateModified",
];

export const FRONTMATTER_KEY_ORDER = [
  "title",
  "slug",
  "arcana",
  "suit",
  "card_number",
  "tier",
  "status",
  "summary",
  "metaTitle",
  "metaDescription",
  ...BACKFILL_FIELDS,
  "themes",
  "life_areas",
  "seeker_states",
  "compass_pillars",
  "related_cards",
  "related_articles",
];

export function stripYamlEditorial(raw) {
  return raw.replace(/^#.*\n/gm, "").replace(/^---\n/gm, "");
}

export function parseMetadataMap(raw = fs.readFileSync(METADATA_MAP_PATH, "utf8")) {
  return yaml.load(stripYamlEditorial(raw));
}

export function slugFromCollectionId(collectionId) {
  const segment = collectionId.split("/").pop();
  return segment?.trim() || collectionId;
}

export function markdownPathForCollectionId(collectionId) {
  const [suit, ...rest] = collectionId.split("/");
  const slug = rest.join("/") || suit;
  if (!SUIT_FOLDERS.includes(suit)) {
    throw new Error(`Unknown suit folder in collection id: ${collectionId}`);
  }
  return path.join(CONTENT_ROOT, suit, `${slugFromCollectionId(collectionId)}.md`);
}

export function expectedCanonicalPath(slug) {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  return `/repeating-card-meanings/${normalized}/`;
}

export function expectedCanonicalUrl(slug) {
  return `${SITE_ORIGIN}${expectedCanonicalPath(slug)}`;
}

/** Matches `tarotCardImagePath` in src/lib/tarotCardImage.ts */
export function expectedOpenGraphPath(slug) {
  const fileId = slug === "wheel-of-fortune" ? "the-wheel-of-fortune" : slug;
  return `/images/tarot/rws/${fileId}.jpg`;
}

export function expectedOpenGraphUrl(slug) {
  return `${SITE_ORIGIN}${expectedOpenGraphPath(slug)}`;
}

export function openGraphPublicFile(slug) {
  return path.join(PUBLIC_RWS_DIR, path.basename(expectedOpenGraphPath(slug)));
}

export function isNonEmpty(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

export function splitMarkdownFile(content) {
  if (!content.startsWith("---")) {
    throw new Error("Markdown file is missing YAML frontmatter");
  }
  const end = content.indexOf("\n---", 3);
  if (end === -1) {
    throw new Error("Markdown file frontmatter is not closed");
  }
  const frontmatterRaw = content.slice(4, end);
  const body = content.slice(end + 4);
  return { frontmatterRaw, body };
}

export function parseFrontmatter(content) {
  const { frontmatterRaw, body } = splitMarkdownFile(content);
  const data = yaml.load(frontmatterRaw) ?? {};
  return { data, body };
}

export function orderFrontmatterKeys(data) {
  const ordered = {};
  const seen = new Set();
  for (const key of FRONTMATTER_KEY_ORDER) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      ordered[key] = data[key];
      seen.add(key);
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (!seen.has(key)) ordered[key] = value;
  }
  return ordered;
}

export function stringifyFrontmatter(data) {
  return yaml.dump(orderFrontmatterKeys(data), {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}

export function serializeMarkdownFile(data, body) {
  const fm = stringifyFrontmatter(data);
  const normalizedBody = body.startsWith("\n") ? body : `\n${body}`;
  return `---\n${fm}---${normalizedBody}`;
}

/** Approved SEO values from map entry, with governed canonical and OG paths. */
export function metadataBackfillPatch(mapEntry, slug) {
  const patch = {};
  for (const field of BACKFILL_FIELDS) {
    if (field === "canonicalUrl") {
      patch.canonicalUrl = expectedCanonicalPath(slug);
      continue;
    }
    if (field === "openGraphImage") {
      patch.openGraphImage = expectedOpenGraphPath(slug);
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(mapEntry, field)) continue;
    const value = mapEntry[field];
    if (value === undefined || value === null) continue;
    if (field === "secondaryKeywords" && !Array.isArray(value)) continue;
    patch[field] = sanitizeBackfillValue(field, value);
  }
  return patch;
}

export function listCardMarkdownFiles() {
  const files = [];
  for (const suit of SUIT_FOLDERS) {
    const dir = path.join(CONTENT_ROOT, suit);
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      files.push(path.join(dir, name));
    }
  }
  return files.sort();
}

export function collectionIdFromMarkdownPath(filePath) {
  const rel = path.relative(CONTENT_ROOT, filePath).replace(/\\/g, "/");
  const match = rel.match(/^([^/]+)\/(.+)\.md$/);
  if (!match) throw new Error(`Unexpected markdown path: ${filePath}`);
  return `${match[1]}/${match[2]}`;
}

export function containsEmDash(value) {
  if (typeof value === "string") return value.includes("\u2014");
  if (Array.isArray(value)) return value.some((item) => containsEmDash(item));
  return false;
}

/** Project rule: no em dashes in governed SEO frontmatter. */
export function sanitizeBackfillText(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\s*\u2014\s*/g, " - ").replace(/  +/g, " ").trim();
}

export function sanitizeBackfillValue(field, value) {
  if (field === "secondaryKeywords" && Array.isArray(value)) {
    return value.map((item) => sanitizeBackfillText(item));
  }
  if (typeof value === "string") return sanitizeBackfillText(value);
  return value;
}
