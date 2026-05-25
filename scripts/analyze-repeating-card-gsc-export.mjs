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

function findOptionalColumn(header, candidates) {
  const lower = header.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** @returns {"not_indexed_urls" | "indexing_summary" | "performance_top_pages" | "unknown"} */
function detectExportKind(header, firstRow) {
  const lower = header.map((h) => h.trim().toLowerCase());
  if (lower.includes("top pages") && (lower.includes("clicks") || lower.includes("impressions"))) {
    return "performance_top_pages";
  }
  const hasReason = lower.some((h) => h === "reason" || h.includes("why pages aren't indexed"));
  const pagesCol = lower.findIndex((h) => h === "pages" || h === "page count");
  const urlCol = findUrlColumn(header);
  const firstCell = firstRow?.[urlCol]?.trim() ?? "";
  const firstLooksLikeUrl = /^https?:\/\//i.test(firstCell);

  if (hasReason && pagesCol >= 0 && !firstLooksLikeUrl) {
    return "indexing_summary";
  }
  if (hasReason && firstLooksLikeUrl) {
    return "not_indexed_urls";
  }
  if (firstLooksLikeUrl) {
    return "not_indexed_urls";
  }
  return "unknown";
}

function normalizeReason(reason) {
  return reason
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isAlternateCanonicalReason(reason) {
  const n = normalizeReason(reason);
  return n.includes("alternative") && n.includes("canonical");
}

function isDiscoveredNotIndexedReason(reason) {
  const n = normalizeReason(reason);
  return n.includes("discovered") && n.includes("not indexed");
}

function isCrawledNotIndexedReason(reason) {
  const n = normalizeReason(reason);
  return n.includes("crawled") && n.includes("not indexed");
}

/** @returns {{ reason: string, source: string, validation: string, pages: number }[]} */
function loadIndexingSummary(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { header, rows } = parseCsv(raw);
  const lower = header.map((h) => h.trim().toLowerCase());
  const reasonCol = lower.findIndex((h) => h === "reason");
  const sourceCol = lower.findIndex((h) => h === "source");
  const validationCol = lower.findIndex((h) => h === "validation");
  const pagesCol = lower.findIndex((h) => h === "pages" || h === "page count");

  return rows
    .map((row) => ({
      reason: row[reasonCol]?.trim() ?? "",
      source: sourceCol >= 0 ? row[sourceCol]?.trim() ?? "" : "",
      validation: validationCol >= 0 ? row[validationCol]?.trim() ?? "" : "",
      pages: Number.parseInt(row[pagesCol]?.trim() ?? "0", 10) || 0,
    }))
    .filter((r) => r.reason && r.pages > 0);
}

/** @returns {{ rows: { url: string, reason: string | null }[], exportKind: string, header: string[] }} */
function loadGscRows(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { header, rows } = parseCsv(raw);
  const exportKind = detectExportKind(header, rows[0]);
  const urlCol = findUrlColumn(header);
  const reasonCol = findOptionalColumn(header, [
    "reason",
    "status",
    "indexing",
    "indexing status",
    "page indexing",
    "why pages aren't indexed",
  ]);
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    const cell = row[urlCol]?.trim();
    if (!cell) continue;
    const url = normalizeUrl(cell);
    if (seen.has(url)) continue;
    seen.add(url);
    const reason =
      reasonCol >= 0 ? row[reasonCol]?.trim() || null : null;
    out.push({ url, reason });
  }
  return { rows: out, exportKind, header };
}

const EXPORTS_DIR = path.join(ROOT, "docs/seo/exports");
const BASELINES_DIR = path.join(ROOT, "docs/seo/baselines");

function baselineDateFromPath(filePath) {
  const match = path.basename(filePath).match(/gsc-not-indexed-(\d{4}-\d{2}-\d{2})/i);
  return match?.[1] ?? new Date().toISOString().slice(0, 10);
}

/** Site architecture counts for summary-mode inference (sitemap, May 2026). */
const ARCHITECTURE = {
  entityPages: 78,
  toolDeepLinks: 78,
  tagPages: 57,
  sitemapUrls: 185,
};

function writeSummaryBaselineReport({
  exportPath,
  baselineDate,
  summaryRows,
  recommendations,
}) {
  const totalPages = summaryRows.reduce((n, r) => n + r.pages, 0);
  const byReason = summaryRows
    .map((r) => ({ ...r, key: normalizeReason(r.reason) }))
    .sort((a, b) => b.pages - a.pages);

  const discovered = byReason.find((r) => isDiscoveredNotIndexedReason(r.reason));
  const alternate = byReason.find((r) => isAlternateCanonicalReason(r.reason));
  const duplicateUser = byReason.find((r) => r.key.includes("duplicate") && r.key.includes("without"));
  const duplicateGoogle = byReason.find((r) => r.key.includes("duplicate") && r.key.includes("google chose"));
  const crawled = byReason.find((r) => isCrawledNotIndexedReason(r.reason));

  const lines = [
    `# GSC not-indexed baseline — ${baselineDate}`,
    "",
    "Generated by `scripts/analyze-repeating-card-gsc-export.mjs`.",
    "",
    "| Field | Value |",
    "|-------|-------|",
    `| Export file | \`${path.relative(ROOT, exportPath).replace(/\\/g, "/")}\` |`,
    `| Detected export type | **indexing_summary** (reason buckets + page counts) |`,
    `| Total not-indexed pages (GSC) | **${totalPages}** |`,
    `| Per-URL classification | Not in this file — see §2 & optional drill-down export |`,
    "",
    "## 1. GSC reason distribution (measured)",
    "",
    "| Reason | Pages | Source | Validation |",
    "|--------|------:|--------|------------|",
  ];

  for (const row of byReason) {
    lines.push(`| ${row.reason} | ${row.pages} | ${row.source} | ${row.validation} |`);
  }

  lines.push(
    "",
    "## 2. URL classification (inferred from architecture + reason buckets)",
    "",
    "This export is GSC’s **summary** view (Indexing → Pages → Not indexed → Export). It does not list individual URLs. Breakdown below combines **measured reason counts** with **known site surfaces** from sitemap/architecture.",
    "",
    "| Bucket | Measured in export | Inference |",
    "|--------|-------------------:|-----------|",
  );

  if (alternate) {
    lines.push(
      `| Tool deep-links / alternates (healthy) | **${alternate.pages}** | “Alternative page with proper canonical tag” — aligns with tool URLs canonicalising to entity pages |`,
    );
  }
  if (discovered) {
    lines.push(
      `| Discovered – not indexed (mixed) | **${discovered.pages}** | Likely includes many canonical entities, tag hubs, library pagination, hub pages — **not** tool alternates (those usually surface under Alternate canonical) |`,
    );
  }
  if (crawled) {
    lines.push(
      `| Crawled – currently not indexed | **${crawled.pages}** | Low-priority or timing; URL drill-down recommended |`,
    );
  }

  const otherRows = byReason.filter(
    (r) => r !== discovered && r !== alternate && r !== crawled,
  );
  const otherTotal = otherRows.reduce((n, r) => n + r.pages, 0);
  if (otherTotal > 0) {
    lines.push(
      `| Redirects / 404 / other | **${otherTotal}** | ${otherRows.map((r) => r.reason).join("; ")} |`,
    );
  }

  lines.push(
    "",
    "### Architecture reference (not from GSC file)",
    "",
    `- Canonical entity pages in sitemap: **${ARCHITECTURE.entityPages}**`,
    `- Tool deep-links (crawlable, non-canonical): **${ARCHITECTURE.toolDeepLinks}**`,
    `- Tag pages in sitemap: **${ARCHITECTURE.tagPages}**`,
    `- Total sitemap URLs: **${ARCHITECTURE.sitemapUrls}**`,
    "",
    "## 3. Repeating-card entity analysis",
    "",
  );

  if (duplicateUser || duplicateGoogle) {
    lines.push(
      "- **Canonical confusion:** GSC reports duplicate/canonical conflicts — **investigate immediately.**",
    );
  } else {
    lines.push(
      "- **No duplicate-without-canonical or wrong-canonical bucket** in this summary — canonical architecture looks healthy at bucket level.",
    );
  }

  if (alternate && alternate.pages > 0 && alternate.pages <= 20) {
    lines.push(
      `- **${alternate.pages} alternate URLs with proper canonical** — consistent with a small set of tool/duplicate surfaces, not mass canonical failure (expected ~${ARCHITECTURE.toolDeepLinks} tool URLs over time).`,
    );
  }

  if (discovered) {
    lines.push(
      `- **${discovered.pages} discovered-not-indexed** — largest bucket; many canonical entities may sit here while Google queues indexing after the strengthening deploy. Per-entity status requires drill-down export.`,
    );
  }

  lines.push(
    "",
    "## 4. Canonical health",
    "",
  );

  const dangerous = [];
  if (duplicateUser) dangerous.push(duplicateUser.reason);
  if (duplicateGoogle) dangerous.push(duplicateGoogle.reason);
  if (dangerous.length) {
    lines.push(`- **Dangerous patterns present:** ${dangerous.join("; ")}`);
  } else {
    lines.push("- **No dangerous canonical buckets** in summary export.");
  }
  if (alternate) {
    lines.push(`- **Healthy:** “${alternate.reason}” (${alternate.pages} pages) — consolidation working.`);
  }

  lines.push(
    "",
    "## 5. Operational recommendation",
    "",
    ...recommendations.map((r) => `- ${r}`),
    "",
    "## 6. Optional: per-URL drill-down",
    "",
    "In GSC, open each reason row → view example URLs → **Export** URL list. Save as:",
    "`docs/seo/exports/gsc-not-indexed-urls-YYYY-MM-DD.csv` and re-run this script for URL-level entity/tool/tag counts.",
    "",
  );

  fs.mkdirSync(BASELINES_DIR, { recursive: true });
  const outPath = path.join(BASELINES_DIR, `gsc-baseline-${baselineDate}.md`);
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`\nBaseline report: ${path.relative(ROOT, outPath)}`);
  return outPath;
}

function writeBaselineReport({
  exportPath,
  baselineDate,
  exportKind,
  gscRows,
  counts,
  entityInExport,
  entityMissing,
  toolAlts,
  nonEntityCanonical,
  summaryRows,
}) {
  const total = gscRows.length;
  const entityPct = ((entityInExport.length / 78) * 100).toFixed(1);
  const toolPct = total ? ((toolAlts.length / total) * 100).toFixed(1) : "0";
  const tagCount = counts.tag ?? 0;

  const lines = [
    `# GSC not-indexed baseline — ${baselineDate}`,
    "",
    "Generated by `scripts/analyze-repeating-card-gsc-export.mjs`.",
    "",
    "| Field | Value |",
    "|-------|-------|",
    `| Export file | \`${path.relative(ROOT, exportPath).replace(/\\/g, "/")}\` |`,
    `| Detected export type | **${exportKind}** |`,
    `| URLs in export | ${total} |`,
    `| Canonical entities listed | ${entityInExport.length} / 78 (${entityPct}%) |`,
    `| Entities not in export | ${entityMissing.length} (may already be indexed) |`,
    `| Tool deep-links | ${toolAlts.length} (${toolPct}% of export) |`,
    `| Tag pages | ${tagCount} |`,
    "",
    "## Classification counts",
    "",
    "```",
    summarize(counts),
    "```",
    "",
    "## Interpretation (snapshot)",
    "",
  ];

  if (exportKind === "performance_top_pages") {
    lines.push(
      "- **Wrong export for not-indexed baseline:** File columns are `Top pages`, `Clicks`, `Impressions` — this is a **Performance** export, not **Pages → Not indexed**. Re-export and re-run. Do **not** use `--update-tracker` on this file.",
    );
  }

  if (exportKind === "indexing_summary" && summaryRows?.length) {
    lines.push("", "## GSC reason distribution (summary export)", "", "| Reason | Pages |", "|--------|------:|");
    for (const row of summaryRows) {
      lines.push(`| ${row.reason} | ${row.pages} |`);
    }
    lines.push(
      "",
      "_See full baseline sections 1–6 in this file (summary mode generates extended report on first run)._",
    );
  }

  if (toolAlts.length >= 70 && entityInExport.length < 20) {
    lines.push(
      "- **Healthy architecture signal:** Export is dominated by tool alternates; entity volume is low — consistent with canonical consolidation.",
    );
  }
  if (entityInExport.length > 40) {
    lines.push(
      "- **Watch:** Many canonical entity URLs appear in not-indexed export — track Wave 1 cards in tracker CSV; consider manual requests per runbook.",
    );
  }
  if (entityMissing.length >= 60) {
    lines.push(
      "- **Note:** Most entities absent from this export — normal for a *not indexed only* export if Google is already indexing entity URLs.",
    );
  }
  if (nonEntityCanonical.length > 0) {
    lines.push(
      `- **Investigate:** ${nonEntityCanonical.length} URL(s) match entity path pattern but are not in the 78-card registry.`,
    );
  }

  lines.push(
    "",
    "## Canonical entities in this export",
    "",
  );
  if (entityInExport.length === 0) {
    lines.push("_None listed — good early signal if strengthening pass is recent._");
  } else {
    for (const url of entityInExport.sort()) {
      const row = gscRows.find((r) => r.url === url);
      const reason = row?.reason ? ` — ${row.reason}` : "";
      lines.push(`- ${url}${reason}`);
    }
  }

  lines.push(
    "",
    "## Next steps",
    "",
    "1. Update `docs/seo/repeating-card-index-tracker.csv` (`indexed`, `gsc_status`, `last_checked`).",
    "2. Re-run with `--update-tracker` only after manual review of `indexed` column.",
    "3. Submit GSC indexing requests for Wave 0 hub + Wave 1 entities per runbook.",
    "",
  );

  fs.mkdirSync(BASELINES_DIR, { recursive: true });
  const outPath = path.join(BASELINES_DIR, `gsc-baseline-${baselineDate}.md`);
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`\nBaseline report: ${path.relative(ROOT, outPath)}`);
  return outPath;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const updateTracker = args.includes("--update-tracker");
  const noReport = args.includes("--no-report");
  let file = args.find((a) => !a.startsWith("--"));
  if (!file && fs.existsSync(EXPORTS_DIR)) {
    const candidates = fs
      .readdirSync(EXPORTS_DIR)
      .filter((n) => /^gsc-not-indexed-\d{4}-\d{2}-\d{2}\.csv$/i.test(n))
      .sort()
      .reverse();
    if (candidates[0]) file = path.join(EXPORTS_DIR, candidates[0]);
  }
  return { file, updateTracker, writeReport: !noReport };
}

function summarize(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");
}

function maybeUpdateTrackerFromSummary(summaryRows, baselineDate) {
  if (!fs.existsSync(TRACKER)) {
    console.warn(`Tracker not found: ${TRACKER}`);
    return;
  }
  const summaryNote = summaryRows
    .map((r) => `${r.reason} (${r.pages})`)
    .join("; ");
  const raw = fs.readFileSync(TRACKER, "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = lines[0];
  const out = [header];

  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    cols[4] = baselineDate;
    cols[5] = "summary_export";
    cols[9] = `GSC summary ${baselineDate}: ${summaryNote}`;
    out.push(cols.map((c) => (/[",\n\r]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","));
  }

  fs.writeFileSync(TRACKER, `${out.join("\n")}\n`, "utf8");
  console.log(`\nUpdated tracker (summary mode): ${path.relative(ROOT, TRACKER)}`);
  console.log("  indexed column unchanged — use URL drill-down export for per-entity Y/N.");
}

function maybeUpdateTracker(entityUrlsInExport, gscByUrl, baselineDate) {
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
    cols[4] = baselineDate ?? today;
    cols[5] = status;
    out.push(cols.map((c) => (/[",\n\r]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","));
  }

  fs.writeFileSync(TRACKER, `${out.join("\n")}\n`, "utf8");
  console.log(`\nUpdated tracker: ${path.relative(ROOT, TRACKER)}`);
}

const { file, updateTracker, writeReport } = parseArgs(process.argv);
if (!file) {
  console.error(
    "Usage: node scripts/analyze-repeating-card-gsc-export.mjs <gsc-export.csv> [--update-tracker] [--no-report]",
  );
  console.error(
    `Or place export at: docs/seo/exports/gsc-not-indexed-YYYY-MM-DD.csv`,
  );
  process.exit(1);
}

const exportPath = path.resolve(file);
if (!fs.existsSync(exportPath)) {
  console.error(`File not found: ${exportPath}`);
  process.exit(1);
}

const baselineDate = baselineDateFromPath(exportPath);
const entities = listRepeatingCardEntities();
const entitySet = new Set(entities.map((e) => normalizeUrl(e.entityUrl)));

const raw = fs.readFileSync(exportPath, "utf8");
const { header, rows: csvRows } = parseCsv(raw);
const exportKind = detectExportKind(header, csvRows[0]);

if (exportKind === "performance_top_pages") {
  console.warn(
    "\nWARNING: This looks like a Performance → Top pages export, not Pages → Not indexed.",
  );
  console.warn("Re-export from GSC (Indexing → Pages → Not indexed → Export) for a valid baseline.\n");
}

if (exportKind === "indexing_summary") {
  const summaryRows = loadIndexingSummary(exportPath);
  const totalPages = summaryRows.reduce((n, r) => n + r.pages, 0);

  console.log("GSC indexing summary (Not indexed)");
  console.log("================================");
  console.log(`Export file: ${path.relative(ROOT, exportPath)}`);
  console.log(`Export type: indexing_summary`);
  console.log(`Total not-indexed pages: ${totalPages}`);
  console.log("\nReason distribution:");
  for (const row of summaryRows.sort((a, b) => b.pages - a.pages)) {
    console.log(`  ${row.pages}\t${row.reason}`);
  }

  const alternate = summaryRows.find((r) => isAlternateCanonicalReason(r.reason));
  const discovered = summaryRows.find((r) => isDiscoveredNotIndexedReason(r.reason));
  const duplicateBad = summaryRows.some((r) => normalizeReason(r.reason).includes("duplicate"));

  console.log("\nRepeating-card / canonical signals:");
  console.log(
    `  Alternate page with proper canonical: ${alternate?.pages ?? 0} (healthy tool/consolidation signal)`,
  );
  console.log(`  Discovered – not indexed: ${discovered?.pages ?? 0} (mixed; URL drill-down needed)`);
  console.log(`  Duplicate canonical buckets: ${duplicateBad ? "YES — investigate" : "none"}`);

  const recommendations = [];
  if (!duplicateBad && (alternate?.pages ?? 0) <= 20) {
    recommendations.push(
      "**Exclusion pattern is mostly healthy** at summary level: small alternate-canonical bucket, no duplicate-without-canonical.",
    );
  }
  if ((discovered?.pages ?? 0) > 100) {
    recommendations.push(
      "**Wave 0 (hub):** Proceed — request indexing for `/repeating-card-meanings/` after indexing-strengthening deploy.",
    );
    recommendations.push(
      "**Wave 1 (12 P1 entities):** Proceed in batches — largest bucket is Discovered; aligns with new entity cluster queueing.",
    );
  }
  recommendations.push(
    "**URL drill-down:** Export URL lists from “Discovered” and “Alternate” rows in GSC for per-entity tracker `indexed` Y/N.",
  );
  if (summaryRows.some((r) => normalizeReason(r.reason).includes("404"))) {
    recommendations.push("**Immediate attention:** 404 bucket — identify URL in GSC drill-down.");
  }

  console.log("\nOperational:");
  for (const r of recommendations) console.log(`  - ${r.replace(/\*\*/g, "")}`);

  if (writeReport) {
    writeSummaryBaselineReport({
      exportPath,
      baselineDate,
      summaryRows,
      recommendations,
    });
  }

  if (updateTracker) {
    maybeUpdateTrackerFromSummary(summaryRows, baselineDate);
  }
  process.exit(0);
}

const { rows: gscRows } = loadGscRows(exportPath);
const gscUrls = gscRows.map((r) => r.url);

const counts = {};
const gscByUrl = new Map();
for (const { url, reason } of gscRows) {
  const type = classify(url);
  counts[type] = (counts[type] ?? 0) + 1;
  gscByUrl.set(url, reason ? `${type}: ${reason}` : type);
}

const entityInExport = [...entitySet].filter((u) => gscUrls.includes(u));
const entityMissing = [...entitySet].filter((u) => !gscUrls.includes(u));
const entityUrlsInExport = new Set(entityInExport);

console.log("GSC export classification");
console.log("========================");
console.log(`Export file: ${path.relative(ROOT, exportPath)}`);
console.log(`Export type: ${exportKind}`);
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

const reasonCounts = {};
for (const { reason } of gscRows) {
  if (!reason) continue;
  const key = normalizeReason(reason);
  reasonCounts[key] = (reasonCounts[key] ?? 0) + 1;
}
if (Object.keys(reasonCounts).length) {
  console.log("\nGSC reason distribution (URL export):");
  for (const [reason, n] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}\t${reason}`);
  }
}

if (entityMissing.length > 0 && entityMissing.length <= 20) {
  console.log("\nEntities not in this export (may still be indexed):");
  for (const u of entityMissing) console.log(`  ${u}`);
} else if (entityMissing.length > 20) {
  console.log(`\n${entityMissing.length} entities not listed — normal if export is 'not indexed' only.`);
}

if (writeReport) {
  writeBaselineReport({
    exportPath,
    baselineDate,
    exportKind,
    gscRows,
    counts,
    entityInExport,
    entityMissing,
    toolAlts,
    nonEntityCanonical,
    summaryRows: null,
  });
}

if (updateTracker) {
  if (exportKind === "performance_top_pages") {
    console.error("Refusing --update-tracker: export is Performance (Top pages), not Not indexed.");
    process.exit(2);
  }
  maybeUpdateTracker(entityUrlsInExport, gscByUrl, baselineDate);
}
