/**
 * Classify a Google Search Console URL export and compare against canonical entities.
 *
 * Usage:
 *   node scripts/analyze-repeating-card-gsc-export.mjs <gsc-pages.csv>
 *   node scripts/analyze-repeating-card-gsc-export.mjs <export.csv> --update-tracker
 *
 * GSC export: Pages report → Export. CSV must include a URL column (Page, URL, or Top pages).
 */
import fs from "node:fs";
import path from "node:path";
import { listRepeatingCardEntities, entityUrlPattern, toolDeepLinkPattern } from "./lib/repeating-card-entity-urls.mjs";
import { SITE_ORIGIN } from "./lib/repeating-card-metadata-core.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const TRACKER = path.join(ROOT, "docs/seo/repeating-card-index-tracker.csv");

const CLASSIFIERS = [
  {
    type: "entity_canonical",
    label: "Canonical entity page",
    test: (url) => entityUrlPattern().test(normalizeUrl(url)),
  },
  {
    type: "entity_hub",
    label: "Entity hub",
    test: (url) => /^\/repeating-card-meanings\/?$/i.test(pathOnly(url)),
  },
  {
    type: "tool_deep_link",
    label: "Tool deep-link (healthy alternate)",
    test: (url) => toolDeepLinkPattern().test(normalizeUrl(url)),
  },
  {
    type: "tool_hub",
    label: "Tool hub",
    test: (url) => /^\/tools\/repeating-card-meanings\/?$/i.test(pathOnly(url)),
  },
  {
    type: "tag",
    label: "Tag page",
    test: (url) => /^\/tags\//i.test(pathOnly(url)),
  },
  {
    type: "library_pagination",
    label: "Article library pagination/sort",
    test: (url) => /^\/articles\/(page\/|oldest\/|series\/)/i.test(pathOnly(url)),
  },
  {
    type: "article",
    label: "Article",
    test: (url) => /^\/articles\/[^/]+\/?$/i.test(pathOnly(url)),
  },
  {
    type: "blog",
    label: "Field Notes / blog",
    test: (url) => /^\/blog\//i.test(pathOnly(url)),
  },
  {
    type: "utility",
    label: "Utility / conversion",
    test: (url) =>
      /^\/(subscribe|contact|privacy|terms|media|compass|practice)\/?/i.test(pathOnly(url)),
  },
  {
    type: "other_tool",
    label: "Other tool route",
    test: (url) => /^\/tools\//i.test(pathOnly(url)),
  },
];

function normalizeUrl(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  try {
    const u = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, SITE_ORIGIN);
    u.hash = "";
    let p = u.pathname;
    if (!p.endsWith("/")) p += "/";
    return `${u.origin}${p}`;
  } catch {
    return trimmed;
  }
}

function pathOnly(url) {
  try {
    return new URL(normalizeUrl(url)).pathname;
  } catch {
    return url;
  }
}

function classify(url) {
  const normalized = normalizeUrl(url);
  for (const c of CLASSIFIERS) {
    if (c.test(normalized)) return c.type;
  }
  return "other";
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(splitCsvLine);
  return { header, rows };
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function findUrlColumn(header) {
  const candidates = ["page", "url", "top pages", "top page", "address"];
  const lower = header.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c);
    if (idx >= 0) return idx;
  }
  return 0;
}

function loadGscUrls(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { header, rows } = parseCsv(raw);
  const col = findUrlColumn(header);
  const urls = new Set();
  for (const row of rows) {
    const cell = row[col]?.trim();
    if (cell) urls.add(normalizeUrl(cell));
  }
  return [...urls];
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const updateTracker = args.includes("--update-tracker");
  const file = args.find((a) => !a.startsWith("--"));
  return { file, updateTracker };
}

function summarize(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");
}

function maybeUpdateTracker(entityUrlsInExport, gscByUrl) {
  if (!fs.existsSync(TRACKER)) {
    console.warn(`Tracker not found: ${TRACKER}`);
    return;
  }
  const raw = fs.readFileSync(TRACKER, "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = lines[0];
  const today = new Date().toISOString().slice(0, 10);
  const out = [header];

  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const entityUrl = normalizeUrl(cols[0]);
    const inExport = entityUrlsInExport.has(entityUrl);
    const status = gscByUrl.get(entityUrl) ?? (inExport ? "in_export" : "not_in_export");
    cols[3] = inExport ? "Y" : cols[3] || "";
    cols[4] = today;
    cols[5] = status;
    out.push(cols.map((c) => (/[",\n\r]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","));
  }

  fs.writeFileSync(TRACKER, `${out.join("\n")}\n`, "utf8");
  console.log(`\nUpdated tracker: ${path.relative(ROOT, TRACKER)}`);
}

const { file, updateTracker } = parseArgs(process.argv);
if (!file) {
  console.error(
    "Usage: node scripts/analyze-repeating-card-gsc-export.mjs <gsc-export.csv> [--update-tracker]",
  );
  process.exit(1);
}

const exportPath = path.resolve(file);
if (!fs.existsSync(exportPath)) {
  console.error(`File not found: ${exportPath}`);
  process.exit(1);
}

const entities = listRepeatingCardEntities();
const entitySet = new Set(entities.map((e) => normalizeUrl(e.entityUrl)));
const gscUrls = loadGscUrls(exportPath);

const counts = {};
const gscByUrl = new Map();
for (const url of gscUrls) {
  const type = classify(url);
  counts[type] = (counts[type] ?? 0) + 1;
  gscByUrl.set(url, type);
}

const entityInExport = [...entitySet].filter((u) => gscUrls.includes(u));
const entityMissing = [...entitySet].filter((u) => !gscUrls.includes(u));
const entityUrlsInExport = new Set(entityInExport);

console.log("GSC export classification");
console.log("========================");
console.log(`Export file: ${path.relative(ROOT, exportPath)}`);
console.log(`URLs in export: ${gscUrls.length}`);
console.log("\nBy type:");
console.log(summarize(counts));

console.log("\nCanonical entities (78)");
console.log(`  Present in export: ${entityInExport.length}`);
console.log(`  Not listed in export: ${entityMissing.length}`);

const nonEntityCanonical = gscUrls.filter(
  (u) => classify(u) === "entity_canonical" && !entitySet.has(u),
);
if (nonEntityCanonical.length) {
  console.log(`  Unexpected entity-shaped URLs: ${nonEntityCanonical.length}`);
}

const toolAlts = gscUrls.filter((u) => classify(u) === "tool_deep_link");
console.log(`\nTool deep-links in export: ${toolAlts.length} (typically healthy alternates)`);

if (entityMissing.length > 0 && entityMissing.length <= 20) {
  console.log("\nEntities not in this export (may still be indexed):");
  for (const u of entityMissing) console.log(`  ${u}`);
} else if (entityMissing.length > 20) {
  console.log(`\n${entityMissing.length} entities not listed — normal if export is 'not indexed' only.`);
}

if (updateTracker) {
  maybeUpdateTracker(entityUrlsInExport, gscByUrl);
}
