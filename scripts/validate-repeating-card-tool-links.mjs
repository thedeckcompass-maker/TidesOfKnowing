/**
 * Ensures collection ids map to entity canonical paths and tool selector query URLs.
 * Mirrors repeatingCardUrls.ts helpers used by the rendered tool UI.
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
const SUIT_FOLDERS = ["majors", "cups", "swords", "wands", "pentacles"];

/** Same as normalizeCardSlug() in src/lib/repeatingCardUrls.ts for string ids. */
function cardSlugFromCollectionIdOrSlug(value) {
  const segment = value.replace(/^\/+|\/+$/g, "");
  return segment.includes("/")
    ? (segment.split("/").pop() ?? segment)
    : segment;
}

function canonicalPathFromCollectionId(collectionId) {
  return expectedCanonicalPath(cardSlugFromCollectionIdOrSlug(collectionId));
}

function toolSelectorPath(collectionId) {
  const encoded = encodeURIComponent(collectionId);
  return `/tools/repeating-card-meanings/?card=${encoded}#rcm-card-select`;
}

const errors = [];
const map = parseMetadataMap();
const files = listCardMarkdownFiles();

if (files.length !== 78) {
  errors.push(`Expected 78 card files, found ${files.length}.`);
}

if (!fs.existsSync(path.join(ENTITY_ROUTE_DIR, "[...slug].astro"))) {
  errors.push("Missing entity route src/pages/repeating-card-meanings/[...slug].astro");
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

  if (canonical !== `/repeating-card-meanings/${slug}/`) {
    errors.push(
      `${collectionId}: expected canonical /repeating-card-meanings/${slug}/, got "${canonical}".`,
    );
  }

  for (const suit of SUIT_FOLDERS) {
    if (canonical.includes(`/repeating-card-meanings/${suit}/`)) {
      errors.push(`${collectionId}: canonical must not include suit folder "${suit}".`);
    }
  }

  const wrongPath = `/repeating-card-meanings/${collectionId}/`;
  if (canonical === wrongPath) {
    errors.push(`${collectionId}: canonical path incorrectly includes full collection id.`);
  }

  const selector = toolSelectorPath(collectionId);
  const parsed = new URL(selector, "https://www.tidesofknowing.com");
  const decoded = parsed.searchParams.get("card");
  if (decoded !== collectionId) {
    errors.push(
      `${collectionId}: tool selector decode mismatch (got "${decoded ?? ""}").`,
    );
  }
  if (parsed.hash !== "#rcm-card-select") {
    errors.push(`${collectionId}: tool selector URL missing #rcm-card-select hash.`);
  }
}

if (errors.length) {
  console.error("Repeating card tool link validation failed:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK: ${files.length} cards — canonical /repeating-card-meanings/{slug}/; selector ?card= with #rcm-card-select; no suit segments in canonicals.`,
);
