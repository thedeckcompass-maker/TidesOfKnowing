/**
 * Backfill governed SEO/AEO frontmatter from card-metadata-map.yaml.
 * Body content is never modified.
 */
import fs from "node:fs";
import {
  BACKFILL_FIELDS,
  METADATA_MAP_PATH,
  collectionIdFromMarkdownPath,
  containsEmDash,
  isNonEmpty,
  listCardMarkdownFiles,
  markdownPathForCollectionId,
  metadataBackfillPatch,
  parseFrontmatter,
  parseMetadataMap,
  sanitizeBackfillValue,
  serializeMarkdownFile,
  slugFromCollectionId,
} from "./lib/repeating-card-metadata-core.mjs";

const map = parseMetadataMap();
const stats = {
  cardsUpdated: 0,
  cardsUnchanged: 0,
  fieldsAdded: Object.fromEntries(BACKFILL_FIELDS.map((f) => [f, 0])),
  skippedExisting: [],
  missingMap: [],
  overwrites: [],
  emDashNormalized: [],
};

const mapIds = new Set(Object.keys(map));

for (const collectionId of mapIds) {
  const filePath = markdownPathForCollectionId(collectionId);
  if (!fs.existsSync(filePath)) {
    console.warn(`WARN: map entry ${collectionId} has no markdown at ${filePath}`);
  }
}

for (const filePath of listCardMarkdownFiles()) {
  const collectionId = collectionIdFromMarkdownPath(filePath);
  const slug = slugFromCollectionId(collectionId);
  const mapEntry = map[collectionId];

  if (!mapEntry) {
    stats.missingMap.push(collectionId);
    continue;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const { data, body } = parseFrontmatter(original);
  const patch = metadataBackfillPatch(mapEntry, slug);
  const next = { ...data };
  let changed = false;
  const cardChanges = [];

  for (const field of BACKFILL_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(patch, field)) continue;

    const incoming = patch[field];
    const existing = data[field];

    if (isNonEmpty(existing)) {
      const sanitizedExisting = sanitizeBackfillValue(field, existing);
      const typographyChanged =
        JSON.stringify(sanitizedExisting) !== JSON.stringify(existing);

      if (typographyChanged) {
        next[field] = sanitizedExisting;
        stats.emDashNormalized.push(`${collectionId}.${field}`);
        changed = true;
        continue;
      }

      const same =
        field === "secondaryKeywords"
          ? JSON.stringify(existing) === JSON.stringify(incoming)
          : String(existing).trim() === String(incoming).trim();

      if (!same) {
        stats.skippedExisting.push({
          collectionId,
          field,
          existing,
          incoming,
        });
      }
      continue;
    }

    if (
      field === "secondaryKeywords" &&
      Array.isArray(existing) &&
      existing.length === 0 &&
      Array.isArray(incoming) &&
      incoming.length > 0
    ) {
      next[field] = incoming;
      stats.fieldsAdded[field] += 1;
      cardChanges.push(field);
      changed = true;
      continue;
    }

    if (!isNonEmpty(incoming) && field !== "secondaryKeywords") continue;

    if (field === "secondaryKeywords") {
      if (!Array.isArray(incoming) || incoming.length === 0) continue;
    }

    next[field] = incoming;
    stats.fieldsAdded[field] += 1;
    cardChanges.push(field);
    changed = true;
  }

  if (!changed) {
    stats.cardsUnchanged += 1;
    continue;
  }

  const output = serializeMarkdownFile(next, body);
  if (output !== original) {
    fs.writeFileSync(filePath, output);
    stats.cardsUpdated += 1;
    console.log(`Updated ${collectionId}: ${cardChanges.join(", ")}`);
  } else {
    stats.cardsUnchanged += 1;
  }
}

console.log("\nBackfill summary");
console.log(`  Map: ${METADATA_MAP_PATH}`);
console.log(`  Cards updated: ${stats.cardsUpdated}`);
console.log(`  Cards unchanged: ${stats.cardsUnchanged}`);
console.log(`  Missing map entries: ${stats.missingMap.length}`);
for (const field of BACKFILL_FIELDS) {
  console.log(`  Fields added (${field}): ${stats.fieldsAdded[field]}`);
}

if (stats.emDashNormalized.length > 0) {
  console.log(`\nNormalized em dashes in ${stats.emDashNormalized.length} field(s):`);
  for (const item of stats.emDashNormalized) console.log(`  - ${item}`);
}

if (stats.skippedExisting.length > 0) {
  console.log(`\nSkipped ${stats.skippedExisting.length} existing non-empty value(s) (not overwritten):`);
  for (const item of stats.skippedExisting) {
    console.log(`  - ${item.collectionId}.${item.field}`);
  }
}

if (stats.overwrites.length > 0) {
  console.log(`\nOverwrites: ${stats.overwrites.length}`);
}

if (stats.missingMap.length > 0) {
  console.log("\nMarkdown files without map entries:");
  for (const id of stats.missingMap) console.log(`  - ${id}`);
  process.exit(1);
}

if (mapIds.size !== 78) {
  console.warn(`WARN: metadata map has ${mapIds.size} entries (expected 78)`);
}
