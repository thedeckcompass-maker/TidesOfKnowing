#!/usr/bin/env node
/**
 * Normalise trailing newline sequence at EOF of a Claude RCM working copy
 * to match the card's extracted baseline exactly.
 *
 * Only newline characters after the final non-newline byte may change.
 *
 * Usage:
 *   node scripts/normalise-rcm-eof.mjs --contract <contract.yaml>
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n");
}

/** Split into content (through last non-\n char) and trailing \n sequence only. */
export function splitContentAndEofNewlines(text) {
  const normalized = normalizeNewlines(text);
  let contentEnd = normalized.length;
  while (contentEnd > 0 && normalized[contentEnd - 1] === "\n") {
    contentEnd -= 1;
  }
  const content = normalized.slice(0, contentEnd);
  const eof = normalized.slice(contentEnd);
  return { content, eof, newlineCount: eof.length };
}

export function extractProductionSource(markdown) {
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

export function loadContract(contractPath) {
  const text = readFileSync(contractPath, "utf8");
  const contract = {
    collection_id: null,
    extracted_baseline: null,
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("collection_id:")) {
      contract.collection_id = line
        .slice("collection_id:".length)
        .trim()
        .replace(/^["']|["']$/g, "");
    } else if (line.startsWith("extracted_baseline:")) {
      contract.extracted_baseline = line
        .slice("extracted_baseline:".length)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }

  return contract;
}

export function claudePathFromCollectionId(collectionId, repoRoot = REPO_ROOT) {
  const [suit, slug] = collectionId.split("/");
  return join(
    repoRoot,
    "editorial/repeating-card-library/claude",
    suit,
    `${slug}.md`,
  );
}

/**
 * Apply baseline EOF newline pattern to Claude text.
 * Returns { text, changed, beforeCount, afterCount, contentPrefix }.
 */
export function normaliseEofToBaseline(claudeText, baselineText) {
  const claudeParts = splitContentAndEofNewlines(claudeText);
  const baselineParts = splitContentAndEofNewlines(baselineText);
  const normalised = claudeParts.content + baselineParts.eof;

  return {
    text: normalised,
    changed: normalised !== normalizeNewlines(claudeText),
    beforeCount: claudeParts.newlineCount,
    afterCount: baselineParts.newlineCount,
    contentPrefix: claudeParts.content,
    baselineEof: baselineParts.eof,
  };
}

export function normaliseClaudeWorkingCopy({ contractPath, repoRoot = REPO_ROOT }) {
  const resolvedContract = isAbsolute(contractPath)
    ? contractPath
    : join(repoRoot, contractPath);

  if (!existsSync(resolvedContract)) {
    throw new Error(`Contract not found: ${resolvedContract}`);
  }

  const contract = loadContract(resolvedContract);
  if (!contract.collection_id || !contract.extracted_baseline) {
    throw new Error("Contract must declare collection_id and extracted_baseline.");
  }

  const claudePath = claudePathFromCollectionId(contract.collection_id, repoRoot);
  const baselinePath = isAbsolute(contract.extracted_baseline)
    ? contract.extracted_baseline
    : join(repoRoot, contract.extracted_baseline);

  if (!existsSync(claudePath)) {
    throw new Error(`Claude working copy not found: ${claudePath}`);
  }
  if (!existsSync(baselinePath)) {
    throw new Error(`Extracted baseline not found: ${baselinePath}`);
  }

  const originalClaude = readFileSync(claudePath, "utf8");
  const baselineRaw = readFileSync(baselinePath, "utf8");
  const baseline = extractProductionSource(baselineRaw);

  const result = normaliseEofToBaseline(originalClaude, baseline);

  const afterSplit = splitContentAndEofNewlines(result.text);
  if (afterSplit.content !== result.contentPrefix) {
    throw new Error(
      "BLOCKED: EOF normalisation would alter bytes before the trailing newline sequence.",
    );
  }

  if (result.changed) {
    writeFileSync(claudePath, result.text, "utf8");
  }

  return {
    collectionId: contract.collection_id,
    claudePath,
    baselinePath,
    changed: result.changed,
    beforeCount: result.beforeCount,
    afterCount: result.afterCount,
    contentPrefixBytes: result.contentPrefix.length,
  };
}

function main() {
  const args = process.argv.slice(2);
  const contractIdx = args.indexOf("--contract");
  const contractPath = contractIdx >= 0 ? args[contractIdx + 1] : null;

  if (!contractPath) {
    console.error("Usage: node scripts/normalise-rcm-eof.mjs --contract <contract.yaml>");
    process.exit(2);
  }

  try {
    const report = normaliseClaudeWorkingCopy({ contractPath });

    console.log("EOF newline normalisation (baseline-driven).");
    console.log(`Collection: ${report.collectionId}`);
    console.log(`Claude: ${report.claudePath}`);
    console.log(`Baseline: ${report.baselinePath}`);
    console.log(
      `Trailing newlines: ${report.beforeCount} → ${report.afterCount} (baseline pattern)`,
    );
    console.log(
      `Content prefix unchanged: yes (${report.contentPrefixBytes} bytes before EOF newlines)`,
    );

    if (report.changed) {
      console.log("NORMALISED: Claude working copy EOF updated to match baseline.");
    } else {
      console.log("UNCHANGED: Claude working copy EOF already matches baseline.");
    }
  } catch (err) {
    console.error(err.message ?? err);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
