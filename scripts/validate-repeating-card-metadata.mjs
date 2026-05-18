/**
 * Validates repeating card frontmatter after metadata backfill.
 */
import fs from "node:fs";
import {
  BACKFILL_FIELDS,
  METADATA_MAP_PATH,
  collectionIdFromMarkdownPath,
  containsEmDash,
  expectedCanonicalPath,
  expectedOpenGraphPath,
  isNonEmpty,
  listCardMarkdownFiles,
  parseFrontmatter,
  parseMetadataMap,
  slugFromCollectionId,
  openGraphPublicFile,
} from "./lib/repeating-card-metadata-core.mjs";

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

const map = parseMetadataMap();
const mapIds = Object.keys(map);

if (mapIds.length !== 78) {
  fail(`Metadata map has ${mapIds.length} entries (expected 78).`);
}

const markdownFiles = listCardMarkdownFiles();
if (markdownFiles.length !== 78) {
  fail(`Found ${markdownFiles.length} card markdown files (expected 78).`);
}

const markdownIds = new Set();

for (const filePath of markdownFiles) {
  const collectionId = collectionIdFromMarkdownPath(filePath);
  const slug = slugFromCollectionId(collectionId);
  markdownIds.add(collectionId);

  const mapEntry = map[collectionId];
  if (!mapEntry) {
    fail(`${collectionId}: missing metadata map entry.`);
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const { data } = parseFrontmatter(content);

  for (const field of BACKFILL_FIELDS) {
    const mapHas =
      field === "canonicalUrl" ||
      field === "openGraphImage" ||
      Object.prototype.hasOwnProperty.call(mapEntry, field);

    if (!mapHas && (field === "datePublished" || field === "dateModified")) {
      continue;
    }

    if (!isNonEmpty(data[field])) {
      if (
        field === "datePublished" ||
        field === "dateModified" ||
        (field === "secondaryKeywords" && (!mapEntry.secondaryKeywords || mapEntry.secondaryKeywords.length === 0))
      ) {
        continue;
      }
      fail(`${collectionId}: missing frontmatter field "${field}" after backfill.`);
    }
  }

  if (data.canonicalUrl) {
    const expected = expectedCanonicalPath(slug);
    if (!data.canonicalUrl.endsWith("/")) {
      fail(`${collectionId}: canonicalUrl must end with trailing slash (${data.canonicalUrl}).`);
    }
    if (data.canonicalUrl !== expected) {
      fail(`${collectionId}: canonicalUrl ${data.canonicalUrl} does not match ${expected}.`);
    }
  }

  if (data.openGraphImage) {
    const expected = expectedOpenGraphPath(slug);
    if (data.openGraphImage !== expected) {
      fail(`${collectionId}: openGraphImage ${data.openGraphImage} does not match ${expected}.`);
    }
    const publicFile = openGraphPublicFile(slug);
    if (!fs.existsSync(publicFile)) {
      fail(`${collectionId}: openGraphImage file missing on disk: ${publicFile}`);
    }
  }

  for (const field of BACKFILL_FIELDS) {
    if (containsEmDash(data[field])) {
      fail(`${collectionId}: em dash found in frontmatter field "${field}".`);
    }
  }

  if (data.secondaryKeywords !== undefined && !Array.isArray(data.secondaryKeywords)) {
    fail(`${collectionId}: secondaryKeywords must be an array.`);
  }

  for (const field of ["featuredSnippetAnswer", "answerEngineSummary", "primaryKeyword"]) {
    if (data[field] !== undefined && typeof data[field] !== "string") {
      fail(`${collectionId}: ${field} must be a string.`);
    }
  }
}

for (const collectionId of mapIds) {
  if (!markdownIds.has(collectionId)) {
    fail(`Map entry ${collectionId} has no markdown file.`);
  }
}

if (warnings.length > 0) {
  console.warn("Warnings:\n");
  for (const message of warnings) {
    console.warn(`  - ${message}`);
  }
}

if (errors.length > 0) {
  console.error("Repeating card metadata validation failed:\n");
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log(
  `OK: ${markdownFiles.length} cards validated against ${METADATA_MAP_PATH}; ` +
    "canonical paths, OG images, and schema-shaped frontmatter checks passed.",
);
