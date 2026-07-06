#!/usr/bin/env node
/**
 * Global Repeating Card Meanings integrity audit.
 *
 * Verifies production markdown corpus invariants before/after editorial reinsertion:
 *   - exactly 78 cards with governed suit counts
 *   - unique Astro collection IDs (path-derived)
 *   - unique frontmatter slugs
 *   - unique canonical URLs
 *   - one source file per card
 *
 * Usage:
 *   node scripts/audit-rcm-integrity.mjs
 *   npm run audit:rcm-integrity
 */

import fs from "node:fs";
import path from "node:path";
import {
  CONTENT_ROOT,
  SUIT_FOLDERS,
  collectionIdFromMarkdownPath,
  expectedCanonicalPath,
  listCardMarkdownFiles,
  parseFrontmatter,
  slugFromCollectionId,
} from "./lib/repeating-card-metadata-core.mjs";

const EXPECTED_TOTAL = 78;
const EXPECTED_SUIT_COUNTS = {
  majors: 22,
  cups: 14,
  swords: 14,
  wands: 14,
  pentacles: 14,
};

const errors = [];

function fail(message) {
  errors.push(message);
}

function expectedFrontmatterSlug(collectionId) {
  const cardSlug = slugFromCollectionId(collectionId);
  return `repeating-card-meanings/${cardSlug}`;
}

function main() {
  const markdownFiles = listCardMarkdownFiles();

  if (markdownFiles.length !== EXPECTED_TOTAL) {
    fail(`Expected ${EXPECTED_TOTAL} production card files, found ${markdownFiles.length}.`);
  }

  const suitCounts = Object.fromEntries(SUIT_FOLDERS.map((suit) => [suit, 0]));
  const collectionIds = new Map();
  const frontmatterSlugs = new Map();
  const canonicalUrls = new Map();
  const filePaths = new Map();

  for (const filePath of markdownFiles) {
    const collectionId = collectionIdFromMarkdownPath(filePath);
    const [suit] = collectionId.split("/");

    if (!SUIT_FOLDERS.includes(suit)) {
      fail(`${collectionId}: unknown suit folder "${suit}".`);
      continue;
    }

    suitCounts[suit] = (suitCounts[suit] ?? 0) + 1;

    if (collectionIds.has(collectionId)) {
      fail(
        `Duplicate Astro collection ID "${collectionId}" (${collectionIds.get(collectionId)} vs ${filePath}).`,
      );
    }
    collectionIds.set(collectionId, filePath);

    const normalizedPath = path.normalize(filePath);
    if (filePaths.has(normalizedPath)) {
      fail(`Duplicate source file path: ${normalizedPath}`);
    }
    filePaths.set(normalizedPath, collectionId);

    let data;
    try {
      const content = fs.readFileSync(filePath, "utf8");
      ({ data } = parseFrontmatter(content));
    } catch (error) {
      fail(`${collectionId}: failed to parse frontmatter (${error.message}).`);
      continue;
    }

    const cardSlug = slugFromCollectionId(collectionId);
    const expectedSlug = expectedFrontmatterSlug(collectionId);
    if (data.slug !== expectedSlug) {
      fail(
        `${collectionId}: frontmatter slug "${data.slug}" does not match expected "${expectedSlug}".`,
      );
    }

    if (frontmatterSlugs.has(data.slug)) {
      fail(
        `Duplicate frontmatter slug "${data.slug}" (${frontmatterSlugs.get(data.slug)} vs ${collectionId}).`,
      );
    }
    frontmatterSlugs.set(data.slug, collectionId);

    if (data.canonicalUrl) {
      const expectedCanonical = expectedCanonicalPath(cardSlug);
      if (data.canonicalUrl !== expectedCanonical) {
        fail(
          `${collectionId}: canonicalUrl "${data.canonicalUrl}" does not match expected "${expectedCanonical}".`,
        );
      }

      if (canonicalUrls.has(data.canonicalUrl)) {
        fail(
          `Duplicate canonicalUrl "${data.canonicalUrl}" (${canonicalUrls.get(data.canonicalUrl)} vs ${collectionId}).`,
        );
      }
      canonicalUrls.set(data.canonicalUrl, collectionId);
    }
  }

  for (const suit of SUIT_FOLDERS) {
    const expected = EXPECTED_SUIT_COUNTS[suit];
    const actual = suitCounts[suit] ?? 0;
    if (actual !== expected) {
      fail(`Suit "${suit}": expected ${expected} cards, found ${actual}.`);
    }
  }

  for (const suit of SUIT_FOLDERS) {
    const dir = path.join(CONTENT_ROOT, suit);
    if (!fs.existsSync(dir)) {
      fail(`Missing suit directory: ${dir}`);
      continue;
    }
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      const full = path.join(dir, name);
      if (!markdownFiles.includes(full)) {
        fail(`Unexpected markdown file outside audit set: ${full}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("FAIL: Repeating Card Meanings integrity audit failed.\n");
    for (const message of errors) {
      console.error(`  - ${message}`);
    }
    process.exit(1);
  }

  console.log("PASS: Repeating Card Meanings integrity audit succeeded.");
  console.log(`  Cards: ${markdownFiles.length}`);
  console.log(
    `  Suits: ${SUIT_FOLDERS.map((suit) => `${suit}=${EXPECTED_SUIT_COUNTS[suit]}`).join(", ")}`,
  );
  console.log(`  Unique collection IDs: ${collectionIds.size}`);
  console.log(`  Unique frontmatter slugs: ${frontmatterSlugs.size}`);
  console.log(`  Unique canonical URLs: ${canonicalUrls.size}`);
}

main();
