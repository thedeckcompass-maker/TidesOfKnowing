/**
 * Validates governed related-card map: YAML ↔ TS sync and relationship integrity.
 */
import fs from "node:fs";
import {
  TS_PATH,
  VALID_RELATIONSHIP_TYPES,
  YAML_PATH,
  defaultContentRoot,
  formatRelatedCardMapTs,
  listRepeatingCardCollectionIds,
  parseRelatedCardMapTs,
  readRelatedCardMapYaml,
  slugFromCollectionId,
} from "./lib/repeating-card-related-map-core.mjs";

const errors = [];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const doc = readRelatedCardMapYaml();
const collectionIds = listRepeatingCardCollectionIds(defaultContentRoot());

if (!fs.existsSync(TS_PATH)) {
  fail(`Missing generated file: ${TS_PATH}`);
} else {
  const expectedTs = formatRelatedCardMapTs(doc);
  const actualTs = fs.readFileSync(TS_PATH, "utf8");
  if (actualTs !== expectedTs) {
    fail(
      [
        `${TS_PATH} is out of sync with ${YAML_PATH}.`,
        "Run: node scripts/generate-repeating-card-related-map.mjs",
      ].join("\n"),
    );
  }

  let parsedFromTs;
  try {
    parsedFromTs = parseRelatedCardMapTs(actualTs);
  } catch (err) {
    fail(`Could not parse map from TypeScript: ${err.message}`);
    parsedFromTs = null;
  }

  if (parsedFromTs && JSON.stringify(parsedFromTs) !== JSON.stringify(doc)) {
    fail("TypeScript map object does not match parsed YAML (structural mismatch).");
  }
}

for (const [sourceId, related] of Object.entries(doc)) {
  if (!collectionIds.has(sourceId)) {
    fail(`Map source "${sourceId}" has no matching collection entry.`);
  }

  const sourceSlug = slugFromCollectionId(sourceId);
  const seenTargetSlugs = new Set();

  for (let i = 0; i < related.length; i++) {
    const ref = related[i];
    const label = `${sourceId} related[${i}]`;

    if (!ref || typeof ref.card !== "string" || !ref.card.trim()) {
      fail(`${label}: missing card id.`);
      continue;
    }

    if (!VALID_RELATIONSHIP_TYPES.has(ref.relationship_type)) {
      fail(
        `${label}: invalid relationship_type "${ref.relationship_type}". ` +
          `Expected one of: ${[...VALID_RELATIONSHIP_TYPES].join(", ")}.`,
      );
    }

    if (ref.card === sourceId) {
      fail(`${label}: self-link to ${sourceId}.`);
    }

    if (!collectionIds.has(ref.card)) {
      fail(`${label}: unknown card "${ref.card}" (not in collection).`);
    }

    const targetSlug = slugFromCollectionId(ref.card);
    if (seenTargetSlugs.has(targetSlug)) {
      fail(`${label}: duplicate related slug "${targetSlug}" for ${sourceId}.`);
    }
    seenTargetSlugs.add(targetSlug);

    if (targetSlug === sourceSlug) {
      fail(`${label}: self-link via slug "${targetSlug}" for ${sourceId}.`);
    }
  }
}

if (errors.length > 0) {
  console.error("Repeating card related-map validation failed:\n");
  for (const message of errors) {
    console.error(`  - ${message.replace(/\n/g, "\n    ")}`);
  }
  process.exit(1);
}

console.log(
  `OK: ${YAML_PATH} ↔ ${TS_PATH} in sync; ${Object.keys(doc).length} cards; ` +
    `${collectionIds.size} collection entries checked.`,
);
