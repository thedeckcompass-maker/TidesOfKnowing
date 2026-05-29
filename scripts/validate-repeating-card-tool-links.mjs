/**
 * Ensures collection ids map to entity canonical paths and tool selector query URLs.
 * Mirrors normalizeCardSlug / getRepeatingCardCanonicalPath string branch in repeatingCardUrls.ts.
 */
import fs from "node:fs";
import path from "node:path";
import {
  expectedCanonicalPath,
  listCardMarkdownFiles,
  collectionIdFromMarkdownPath,
  slugFromCollectionId,
  parseMetadataMap,
} from "./lib/repeating-card-metadata-core.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENTITY_ROUTE_DIR = path.join(ROOT, "src/pages/repeating-card-meanings");

function canonicalPathFromCollectionId(collectionId) {
  return expectedCanonicalPath(slugFromCollectionId(collectionId));
}

function toolSelectorPath(collectionId) {
  return `/tools/repeating-card-meanings/?card=${encodeURIComponent(collectionId)}`;
}

function toolDeepPath(collectionId) {
  return `/tools/repeating-card-meanings/${collectionId}/`;
}

const errors = [];
const map = parseMetadataMap();
const files = listCardMarkdownFiles();

if (files.length !== 78) {
  errors.push(`Expected 78 card files, found ${files.length}.`);
}

for (const filePath of files) {
  const collectionId = collectionIdFromMarkdownPath(filePath);
  const slug = slugFromCollectionId(collectionId);
  const canonical = canonicalPathFromCollectionId(collectionId);
  const mapCanonical = map[collectionId]?.canonicalUrl?.trim();

  if (mapCanonical && mapCanonical !== canonical) {
    errors.push(
      `${collectionId}: metadata canonicalUrl "${mapCanonical}" !== slug path "${canonical}".`,
    );
  }

  const wrongPath = `/repeating-card-meanings/${collectionId}/`;
  if (canonical === wrongPath) {
    errors.push(`${collectionId}: canonical path incorrectly includes suit folder.`);
  }

  const selector = toolSelectorPath(collectionId);
  if (!selector.includes(encodeURIComponent(collectionId))) {
    errors.push(`${collectionId}: tool selector URL encoding failed.`);
  }

  const decoded = new URL(selector, "https://www.tidesofknowing.com").searchParams.get("card");
  if (decoded !== collectionId) {
    errors.push(
      `${collectionId}: tool selector decode mismatch (got "${decoded ?? ""}").`,
    );
  }

  if (!fs.existsSync(path.join(ENTITY_ROUTE_DIR, "[...slug].astro"))) {
    errors.push("Missing entity route src/pages/repeating-card-meanings/[...slug].astro");
    break;
  }

  const entityPrerenderMarker = slug;
  if (!canonical.includes(`/${slug}/`)) {
    errors.push(`${collectionId}: canonical path missing slug "${slug}".`);
  }

  if (toolDeepPath(collectionId).includes("//")) {
    errors.push(`${collectionId}: malformed tool deep path.`);
  }
}

if (errors.length) {
  console.error("Repeating card tool link validation failed:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK: ${files.length} cards — canonical paths use card slug only; tool selector ?card= URLs round-trip.`,
);
