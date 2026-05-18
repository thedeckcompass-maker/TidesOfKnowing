import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

export const ROOT = path.resolve(import.meta.dirname, "../..");
export const YAML_PATH = path.join(ROOT, "src/data/related-card-map.yaml");
export const TS_PATH = path.join(ROOT, "src/data/repeating-card-related-map.ts");
export const CONTENT_GLOB_DIRS = ["majors", "cups", "swords", "wands", "pentacles"];

export const VALID_RELATIONSHIP_TYPES = new Set([
  "same-theme",
  "progressive",
  "shadow-pair",
  "suit-companion",
  "archetypal-mirror",
  "resolving-pair",
]);

const SUIT_FOLDERS = new Set(CONTENT_GLOB_DIRS);

/** Strip editorial YAML comments and document separators. */
export function stripRelatedCardMapYaml(raw) {
  return raw.replace(/^#.*\n/gm, "").replace(/^---\n/gm, "");
}

/** Parse governed YAML into `{ [collectionId]: RepeatingCardRelatedRef[] }`. */
export function parseRelatedCardMapYaml(raw) {
  const parsed = yaml.load(stripRelatedCardMapYaml(raw));
  const doc = {};
  for (const [collectionId, value] of Object.entries(parsed)) {
    const related = value?.related;
    if (!Array.isArray(related)) {
      throw new Error(`Missing related array for ${collectionId}`);
    }
    doc[collectionId] = related;
  }
  return doc;
}

export function readRelatedCardMapYaml(filePath = YAML_PATH) {
  return parseRelatedCardMapYaml(fs.readFileSync(filePath, "utf8"));
}

/** Tarot image slug from collection id (`majors/the-fool` → `the-fool`). */
export function slugFromCollectionId(collectionId) {
  const segment = collectionId.split("/").pop();
  return segment?.trim() || collectionId;
}

/** Full TypeScript module source for the related-card map. */
export function formatRelatedCardMapTs(doc) {
  return [
    "/**",
    " * Governed related-card relationships for canonical entity pages.",
    " * Source of truth: `src/data/related-card-map.yaml`",
    " * Regenerate: `node scripts/generate-repeating-card-related-map.mjs`",
    " */",
    "",
    "export type RepeatingCardRelationshipType =",
    '  | "same-theme"',
    '  | "progressive"',
    '  | "shadow-pair"',
    '  | "suit-companion"',
    '  | "archetypal-mirror"',
    '  | "resolving-pair";',
    "",
    "export type RepeatingCardRelatedRef = {",
    "  card: string;",
    "  relationship_type: RepeatingCardRelationshipType;",
    "};",
    "",
    "export const REPEATING_CARD_RELATED_MAP: Record<string, RepeatingCardRelatedRef[]> =",
    `${JSON.stringify(doc, null, 2)};`,
    "",
  ].join("\n");
}

/** Parse map object from generated TypeScript file. */
export function parseRelatedCardMapTs(fileContent) {
  const marker = "export const REPEATING_CARD_RELATED_MAP";
  const start = fileContent.indexOf(marker);
  if (start === -1) {
    throw new Error("Could not find REPEATING_CARD_RELATED_MAP in TypeScript file");
  }
  const jsonStart = fileContent.indexOf("{", start);
  const jsonEnd = fileContent.lastIndexOf("};");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Could not parse map JSON from TypeScript file");
  }
  const jsonText = fileContent.slice(jsonStart, jsonEnd + 1);
  return JSON.parse(jsonText);
}

/** Collection ids from repeating card markdown (`majors/the-fool`, etc.). */
export function listRepeatingCardCollectionIds(contentRoot) {
  const base = path.join(contentRoot, "repeating-card-meanings");
  const ids = new Set();
  for (const suit of SUIT_FOLDERS) {
    const dir = path.join(base, suit);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      ids.add(`${suit}/${name.replace(/\.md$/, "")}`);
    }
  }
  return ids;
}

export function defaultContentRoot() {
  return path.join(ROOT, "src/content");
}
