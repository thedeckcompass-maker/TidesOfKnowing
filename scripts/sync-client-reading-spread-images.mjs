#!/usr/bin/env node
/**
 * Discover spread photographs in content-source/client-readings/images/,
 * optimise copies into public/images/client-readings/{slug}/, and update
 * spreadImages frontmatter on matching Markdown entries.
 *
 * Originals in content-source are never modified.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "content-source/client-readings/images");
const PUBLIC_ROOT = path.join(ROOT, "public/images/client-readings");
const CONTENT_DIR = path.join(ROOT, "src/content/recent-client-readings");
const DOCX_DIR = path.join(ROOT, "content-source/client-readings/docx");

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 82;

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseImageName(filename) {
  const ext = path.extname(filename).toLowerCase();
  const stem = path.basename(filename, ext);
  const seqMatch = stem.match(/^(.+)-(\d+)$/);
  if (!seqMatch) {
    return null;
  }
  return { prefix: seqMatch[1], index: Number(seqMatch[2]), ext };
}

function loadKnownSlugs() {
  const slugs = new Set();
  for (const file of fs.readdirSync(CONTENT_DIR)) {
    if (!file.endsWith(".md")) continue;
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data } = matter(raw);
    if (data.slug) slugs.add(data.slug);
  }
  for (const file of fs.readdirSync(DOCX_DIR)) {
    if (!file.endsWith(".docx")) continue;
    const stem = path.basename(file, ".docx");
    slugs.add(normalizeKey(stem));
  }
  return slugs;
}

function resolveSlug(prefix, knownSlugs) {
  const key = normalizeKey(prefix);
  if (knownSlugs.has(key)) return key;
  return null;
}

function discoverSourceImages(knownSlugs) {
  /** @type {Map<string, { index: number, sourcePath: string, sourceName: string }[]>} */
  const bySlug = new Map();
  /** @type {{ file: string, reason: string }[]} */
  const issues = [];
  /** @type {string[]} */
  const unmatched = [];

  if (!fs.existsSync(SOURCE_DIR)) {
    return { bySlug, issues, unmatched };
  }

  for (const name of fs.readdirSync(SOURCE_DIR)) {
    if (name === "README.md" || !IMAGE_EXT.test(name)) continue;
    const parsed = parseImageName(name);
    if (!parsed) {
      issues.push({
        file: name,
        reason: "Filename must use canonical {slug}-{n}.ext",
      });
      unmatched.push(name);
      continue;
    }
    const { prefix, index, ext } = parsed;
    const slug = resolveSlug(prefix, knownSlugs);
    if (!slug) {
      unmatched.push(name);
      continue;
    }
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      issues.push({ file: name, reason: `Unsupported extension: ${ext}` });
      continue;
    }
    const list = bySlug.get(slug) ?? [];
    if (list.some((item) => item.index === index)) {
      issues.push({
        file: name,
        reason: `Duplicate sequence ${index} for slug ${slug}`,
      });
      continue;
    }
    list.push({
      index,
      sourcePath: path.join(SOURCE_DIR, name),
      sourceName: name,
    });
    bySlug.set(slug, list);
  }

  for (const [slug, items] of bySlug) {
    items.sort((a, b) => a.index - b.index);
    const indices = items.map((item) => item.index);
    if (!indices.includes(1)) {
      issues.push({
        file: items.map((i) => i.sourceName).join(", "),
        reason: `Slug ${slug} has images but none at sequence 1 (found: ${indices.join(", ")})`,
      });
    }
    for (let i = 1; i < indices.length; i += 1) {
      if (indices[i] - indices[i - 1] > 1) {
        issues.push({
          file: slug,
          reason: `Non-contiguous image sequence for ${slug}: ${indices.join(", ")}`,
        });
        break;
      }
    }
  }

  return { bySlug, issues, unmatched };
}

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    return null;
  }
}

async function optimiseCopy(sharp, sourcePath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  if (sharp) {
    await sharp(sourcePath)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(destPath);
    return "optimised";
  }
  fs.copyFileSync(sourcePath, destPath);
  return "copied";
}

function publicPathFor(slug, index) {
  return `/images/client-readings/${slug}/${slug}-${index}.jpg`;
}

function updateFrontmatter(slug, spreadImages) {
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) return false;
  const raw = fs.readFileSync(mdPath, "utf8");
  const parsed = matter(raw);
  parsed.data.spreadImages = spreadImages;
  const next = matter.stringify(parsed.content, parsed.data, {
    lineWidth: 1000,
  });
  fs.writeFileSync(mdPath, next, "utf8");
  return true;
}

function loadAllContentSlugs() {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
      return matter(raw).data.slug;
    })
    .filter(Boolean);
}

async function main() {
  const filterSlug = process.argv
    .find((arg) => arg.startsWith("--slug="))
    ?.split("=")[1];

  const knownSlugs = loadKnownSlugs();
  const sharp = await loadSharp();
  const { bySlug, issues, unmatched } = discoverSourceImages(knownSlugs);

  /** @type {{ slug: string, count: number, images: string[], sources: string[] }[]} */
  const matched = [];
  /** @type {string[]} */
  const noImages = [];

  const slugsToProcess = filterSlug
    ? [filterSlug]
    : [...new Set([...loadAllContentSlugs(), ...bySlug.keys()])];

  for (const slug of slugsToProcess) {
    const items = bySlug.get(slug) ?? [];
    if (items.length === 0) {
      noImages.push(slug);
      if (!filterSlug) {
        updateFrontmatter(slug, []);
      }
      continue;
    }

    const spreadImages = [];
    const sources = [];
    for (const item of items) {
      const destPath = path.join(
        PUBLIC_ROOT,
        slug,
        `${slug}-${item.index}.jpg`,
      );
      const mode = await optimiseCopy(sharp, item.sourcePath, destPath);
      spreadImages.push(publicPathFor(slug, item.index));
      sources.push(`${item.sourceName} (${mode})`);
    }

    updateFrontmatter(slug, spreadImages);
    matched.push({ slug, count: spreadImages.length, images: spreadImages, sources });
  }

  const report = {
    sharpAvailable: Boolean(sharp),
    matched,
    noImages,
    unmatchedSourceFiles: unmatched,
    namingIssues: issues,
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
