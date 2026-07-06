#!/usr/bin/env node
/**
 * Validate a rewritten Repeating Card Meanings file against its extracted original.
 *
 * Editorial Reinsertion Contract — permitted differences:
 *   • Body copy (prose, blockquote text, list item text)
 *   • Frontmatter VALUES for fields listed in allowed_frontmatter_edits (contract only)
 *
 * Usage:
 *   node scripts/validate-rcm-editorial-reinsertion.mjs \
 *     --contract editorial/repeating-card-library/contracts/majors/the-fool.yaml \
 *     path/to/rewritten-the-fool.md
 *
 * Legacy (no contract file):
 *   node scripts/validate-rcm-editorial-reinsertion.mjs <extracted.md> <rewritten.md>
 */

import { readFileSync, existsSync } from "node:fs";

function usage() {
  console.error(`Usage:
  node scripts/validate-rcm-editorial-reinsertion.mjs --contract <contract.yaml> <rewritten.md>
  node scripts/validate-rcm-editorial-reinsertion.mjs <extracted.md> <rewritten.md> [--allow-frontmatter key1,key2]

Contract mode is required for production reinsertions.`);
}

function loadContract(contractPath) {
  const text = readFileSync(contractPath, "utf8");
  const contract = {
    collection_id: null,
    extracted_baseline: null,
    production_target: null,
    allowed_frontmatter_edits: [],
  };

  let inAllowedList = false;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (inAllowedList) {
      if (line.startsWith("- ")) {
        contract.allowed_frontmatter_edits.push(line.slice(2).trim());
        continue;
      }
      inAllowedList = false;
    }

    if (line.startsWith("collection_id:")) {
      contract.collection_id = line.slice("collection_id:".length).trim().replace(/^["']|["']$/g, "");
    } else if (line.startsWith("extracted_baseline:")) {
      contract.extracted_baseline = line.slice("extracted_baseline:".length).trim().replace(/^["']|["']$/g, "");
    } else if (line.startsWith("production_target:")) {
      contract.production_target = line.slice("production_target:".length).trim().replace(/^["']|["']$/g, "");
    } else if (line.startsWith("allowed_frontmatter_edits:")) {
      const inline = line.slice("allowed_frontmatter_edits:".length).trim();
      if (inline === "[]" || inline === "") {
        contract.allowed_frontmatter_edits = [];
      } else {
        inAllowedList = true;
      }
    }
  }

  return contract;
}

function parseArgs(argv) {
  let contractPath = null;
  let extractedPath = null;
  let rewrittenPath = null;
  let allowFrontmatter = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--contract") {
      contractPath = argv[++i];
    } else if (arg === "--allow-frontmatter") {
      allowFrontmatter = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    } else if (!extractedPath && !contractPath) {
      extractedPath = arg;
    } else if (!rewrittenPath) {
      rewrittenPath = arg;
    }
  }

  if (contractPath) {
    if (!rewrittenPath) return { error: "Missing rewritten file path." };
    const contract = loadContract(contractPath);
    extractedPath = contract.extracted_baseline;
    allowFrontmatter = contract.allowed_frontmatter_edits ?? [];
    return { contractPath, contract, extractedPath, rewrittenPath, allowFrontmatter };
  }

  if (!extractedPath || !rewrittenPath) {
    return { error: "Missing required arguments." };
  }

  return { extractedPath, rewrittenPath, allowFrontmatter };
}

function extractProductionSource(markdown) {
  const marker = "# PRODUCTION SOURCE COPY";
  const idx = markdown.indexOf(marker);
  if (idx === -1) return markdown;

  const afterMarker = markdown.slice(idx);
  const fmMatch = afterMarker.match(/^---\r?\n/m);
  if (!fmMatch || fmMatch.index === undefined) {
    throw new Error("Could not locate production frontmatter in extracted file.");
  }
  return afterMarker.slice(fmMatch.index);
}

function splitFrontmatter(markdown) {
  if (!markdown.startsWith("---")) {
    return { frontmatter: null, body: markdown };
  }
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: null, body: markdown };
  }
  const fmEnd = end + 4;
  return {
    frontmatter: markdown.slice(0, fmEnd),
    body: markdown.slice(fmEnd).replace(/^\r?\n/, ""),
  };
}

/** Parse frontmatter into ordered field blocks: { key, lines[] } */
function parseFrontmatterFields(frontmatterBlock) {
  if (!frontmatterBlock) return [];

  const inner = frontmatterBlock
    .replace(/^---\r?\n/, "")
    .replace(/\r?\n---$/, "");
  const lines = inner.split("\n");
  const fields = [];
  let current = null;

  for (const line of lines) {
    const keyMatch = line.match(/^([a-zA-Z_][\w]*):\s*(.*)$/);
    if (keyMatch) {
      if (current) fields.push(current);
      current = { key: keyMatch[1], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) fields.push(current);

  return fields;
}

function classifyLine(line) {
  if (line.startsWith("#")) return "heading";
  if (line === "---") return "hr";
  if (line.startsWith(">")) return "blockquote";
  if (/^\d+\.\s/.test(line)) return "list_item";
  if (line.startsWith("**") && line.endsWith("**")) return "action_header";
  if (line.trim() === "") return "blank";
  return "prose";
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n");
}

function compareFrontmatter(origFm, rewFm, allowedFields, violations) {
  if (origFm === null || rewFm === null) {
    if (origFm !== rewFm) {
      violations.push({
        type: "frontmatter",
        message: "Frontmatter delimiter structure differs.",
      });
    }
    return;
  }

  const origFields = parseFrontmatterFields(origFm);
  const rewFields = parseFrontmatterFields(rewFm);

  if (origFields.length !== rewFields.length) {
    violations.push({
      type: "frontmatter",
      message: `Frontmatter field count differs (${origFields.length} vs ${rewFields.length}). Keys cannot be added or removed.`,
    });
  }

  const max = Math.max(origFields.length, rewFields.length);
  for (let i = 0; i < max; i++) {
    const o = origFields[i];
    const r = rewFields[i];

    if (!o || !r) {
      violations.push({
        type: "frontmatter",
        message: "Frontmatter field missing in one file.",
      });
      continue;
    }

    if (o.key !== r.key) {
      violations.push({
        type: "frontmatter",
        message: `Frontmatter key order or name changed at field ${i + 1}: "${o.key}" vs "${r.key}". Field names are immutable.`,
        original: o.key,
        rewritten: r.key,
      });
      continue;
    }

    const oText = o.lines.join("\n");
    const rText = r.lines.join("\n");

    if (oText === rText) continue;

    if (allowedFields.includes(o.key)) {
      continue;
    }

    violations.push({
      type: "frontmatter",
      field: o.key,
      message: `Frontmatter field "${o.key}" changed but is not in allowed_frontmatter_edits.`,
      original: oText,
      rewritten: rText,
    });
  }
}

function compareFiles(originalRaw, rewrittenRaw, allowedFields) {
  const violations = [];

  const original = normalizeNewlines(originalRaw);
  const rewritten = normalizeNewlines(rewrittenRaw);

  const origParts = splitFrontmatter(original);
  const rewParts = splitFrontmatter(rewritten);

  compareFrontmatter(origParts.frontmatter, rewParts.frontmatter, allowedFields, violations);

  const origBodyLines = origParts.body.split("\n");
  const rewBodyLines = rewParts.body.split("\n");

  if (origBodyLines.length !== rewBodyLines.length) {
    violations.push({
      type: "line_count",
      original: origBodyLines.length,
      rewritten: rewBodyLines.length,
      message: `Body line count differs (${origBodyLines.length} vs ${rewBodyLines.length}).`,
    });
  }

  const lineCount = Math.max(origBodyLines.length, rewBodyLines.length);
  for (let i = 0; i < lineCount; i++) {
    const oLine = origBodyLines[i];
    const rLine = rewBodyLines[i];

    if (oLine === undefined) {
      violations.push({
        type: "extra_line",
        line: i + 1,
        message: "Rewritten file has an extra line not present in the original.",
      });
      continue;
    }
    if (rLine === undefined) {
      violations.push({
        type: "missing_line",
        line: i + 1,
        message: "Rewritten file is missing a line present in the original.",
      });
      continue;
    }

    const oKind = classifyLine(oLine);
    const rKind = classifyLine(rLine);

    if (oKind !== rKind) {
      violations.push({
        type: "line_kind",
        line: i + 1,
        original: oLine,
        rewritten: rLine,
        message: `Line kind changed (${oKind} → ${rKind}).`,
      });
      continue;
    }

    if (["heading", "hr", "blank", "action_header"].includes(oKind) && oLine !== rLine) {
      violations.push({
        type: oKind,
        line: i + 1,
        original: oLine,
        rewritten: rLine,
        message: `${oKind} lines must be byte-identical.`,
      });
    }
  }

  return { violations, origBodyLines, rewBodyLines };
}

function truncateLine(text, max = 140) {
  if (text === undefined) return "(absent)";
  if (!text.trim()) return "(blank line)";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function countWords(text) {
  return (text ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function inferMismatchNature(v, oLine, rLine) {
  if (v.type === "missing_line") return "missing";
  if (v.type === "extra_line") return "added";
  if (v.type === "line_count") return "line_count_delta";

  const oKind = oLine !== undefined ? classifyLine(oLine) : null;
  const rKind = rLine !== undefined ? classifyLine(rLine) : null;

  if (v.type === "line_kind") {
    if (oKind === "prose" && rKind === "hr") return "merged_or_omitted_block";
    if (oKind === "prose" && rKind === "heading") return "reordered_or_omitted_block";
    if (oKind === "heading" && rKind === "prose") return "reordered_or_added_block";
    if (oKind === "hr" && rKind === "heading") return "reordered";
    if (oKind === "blank" && rKind !== "blank") return "missing_blank_line";
    if (oKind !== "blank" && rKind === "blank") return "extra_blank_line";
    if (oKind === "list_item" && rKind === "hr") return "reordered_or_omitted_list";
    return "structural_kind_change";
  }

  if (["heading", "hr", "blank", "action_header"].includes(v.type)) {
    return "structural_marker_changed";
  }

  return v.type;
}

function assessWordContent(oLine, rLine, nature) {
  if (nature === "line_count_delta") {
    return "Structural alignment required before prose-only edits can validate.";
  }
  if (nature === "missing_blank_line" || nature === "extra_blank_line") {
    return "No word content — blank line structure only.";
  }
  if (nature === "structural_marker_changed") {
    return "No prose change permitted — marker must be byte-identical.";
  }
  if (nature === "missing" || nature === "merged_or_omitted_block") {
    return countWords(oLine) > 3
      ? "Possible missing words — original has substantive prose at this position."
      : "Original line may be structural only.";
  }
  if (nature === "added" || nature === "reordered_or_added_block") {
    return countWords(rLine) > 3
      ? "Added substantive line in rewrite."
      : "Added line may be structural only.";
  }
  if (oLine !== undefined && rLine !== undefined && oLine !== rLine) {
    const kind = classifyLine(oLine);
    if (kind === classifyLine(rLine) && ["prose", "blockquote", "list_item"].includes(kind)) {
      return "Same line kind — editorial word changes are permitted when structure aligns.";
    }
  }
  return "Review required — structure does not align at this position.";
}

function printStructuralMismatchReport(origBodyLines, rewBodyLines, violations) {
  if (violations.length === 0) return;

  console.error("STRUCTURAL MISMATCH REPORT");
  console.error("=".repeat(40));
  console.error(
    "STOP. Do not auto-repair paragraphs, blank lines, list items, or Markdown markers.",
  );
  console.error("Report to owner and wait for explicit approval before any correction.\n");

  let itemIndex = 0;

  for (const v of violations) {
    if (v.type === "line_count") {
      const delta = Math.abs(v.original - v.rewritten);
      const direction = v.rewritten < v.original ? "short" : "long";
      console.error("[summary] line_count_delta");
      console.error(`  Original position:  body lines 1–${v.original} (${v.original} lines)`);
      console.error(`  Rewritten position: body lines 1–${v.rewritten} (${v.rewritten} lines)`);
      console.error(
        `  Nature:               ${delta} line${delta === 1 ? "" : "s"} ${direction} in rewrite vs baseline.`,
      );
      console.error(
        `  Word content:         ${assessWordContent(undefined, undefined, "line_count_delta")}\n`,
      );
      continue;
    }

    const line = v.line;
    const oLine = origBodyLines[line - 1];
    const rLine = rewBodyLines[line - 1];
    const nature = inferMismatchNature(v, oLine, rLine);

    itemIndex += 1;
    console.error(`[${itemIndex}] ${nature.replace(/_/g, " ")}`);
    console.error(
      `  Original position:  body line ${line}${
        oLine !== undefined ? ` (${classifyLine(oLine)})` : " (absent)"
      }`,
    );
    console.error(
      `  Rewritten position: body line ${line}${
        rLine !== undefined ? ` (${classifyLine(rLine)})` : " (absent)"
      }`,
    );
    console.error(`  Original content:   ${truncateLine(oLine)}`);
    console.error(`  Rewritten content:  ${truncateLine(rLine)}`);
    console.error(`  Word content:       ${assessWordContent(oLine, rLine, nature)}\n`);
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.error) {
  usage();
  console.error(args.error);
  process.exit(2);
}

const { contractPath, contract, extractedPath, rewrittenPath, allowFrontmatter } = args;

if (!existsSync(extractedPath)) {
  console.error(`BLOCKED: Extracted baseline not found: ${extractedPath}`);
  process.exit(1);
}

if (!existsSync(rewrittenPath)) {
  console.error(`BLOCKED: Rewritten file not found: ${rewrittenPath}`);
  process.exit(1);
}

const extractedRaw = readFileSync(extractedPath, "utf8");
const rewrittenRaw = readFileSync(rewrittenPath, "utf8");
const baseline = extractProductionSource(extractedRaw);
const { violations, origBodyLines, rewBodyLines } = compareFiles(
  baseline,
  rewrittenRaw,
  allowFrontmatter,
);

if (violations.length === 0) {
  console.log("PASS: Editorial Reinsertion Contract validation succeeded.");
  if (contractPath) {
    console.log(`Contract: ${contractPath}`);
    console.log(`Collection: ${contract.collection_id}`);
  }
  if (allowFrontmatter.length > 0) {
    console.log(`Approved frontmatter edits: ${allowFrontmatter.join(", ")}`);
  } else {
    console.log("Frontmatter: byte-identical (no fields approved for editing).");
  }
  console.log("Body: only prose, blockquote, and list-item text may differ.");
  console.log("Proceed to owner review, then reinsertion.");
  process.exit(0);
}

console.error(
  "BLOCKED: Editorial Reinsertion Contract validation failed. STOP — do not reinsert or auto-repair.\n",
);
if (contractPath) {
  console.error(`Contract: ${contractPath}`);
}
for (const v of violations) {
  console.error(`- [${v.type}] ${v.message}`);
  if (v.field) console.error(`  Field: ${v.field}`);
  if (v.line) console.error(`  Body line: ${v.line}`);
  if (v.original !== undefined) console.error(`  Original:  ${v.original}`);
  if (v.rewritten !== undefined) console.error(`  Rewritten: ${v.rewritten}`);
  console.error("");
}
printStructuralMismatchReport(origBodyLines, rewBodyLines, violations);
process.exit(1);
