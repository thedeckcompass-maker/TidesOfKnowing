/**
 * Regenerate docs/seo/repeating-card-index-tracker.csv from ready card content.
 * Run: node scripts/generate-repeating-card-index-tracker.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { listRepeatingCardEntities } from "./lib/repeating-card-entity-urls.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "docs/seo/repeating-card-index-tracker.csv");

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const entities = listRepeatingCardEntities();
if (entities.length !== 78) {
  console.error(`Expected 78 ready entities, found ${entities.length}.`);
  process.exit(1);
}

const header = [
  "entity_url",
  "card_slug",
  "suit",
  "indexed",
  "last_checked",
  "gsc_status",
  "canonical_correct",
  "sitemap_present",
  "manually_requested",
  "notes",
];

const rows = entities.map((e) =>
  [
    e.entityUrl,
    e.slug,
    e.suit,
    "",
    "",
    "",
    "Y",
    "Y",
    "N",
    "",
  ]
    .map(csvEscape)
    .join(","),
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${header.join(",")}\n${rows.join("\n")}\n`, "utf8");
console.log(`Wrote ${entities.length} rows to ${path.relative(ROOT, OUT)}`);
