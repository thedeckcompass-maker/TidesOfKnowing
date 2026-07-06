#!/usr/bin/env node
/**
 * Tests for scripts/normalise-rcm-eof.mjs
 *
 * Run: node scripts/normalise-rcm-eof.test.mjs
 * Or:  npm run test:rcm-eof-normalise
 */

import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  normaliseEofToBaseline,
  splitContentAndEofNewlines,
  normaliseClaudeWorkingCopy,
} from "./normalise-rcm-eof.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function test(name, fn) {
  try {
    fn();
    console.log(`  ok — ${name}`);
    return true;
  } catch (err) {
    console.error(`  FAIL — ${name}`);
    console.error(`         ${err.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;

function run(name, fn) {
  if (test(name, fn)) passed += 1;
  else failed += 1;
}

run("missing final newline is added to match baseline", () => {
  const baseline = "---\ntitle: x\n---\n\nBody line.\n";
  const claude = "---\ntitle: x\n---\n\nBody line.";
  const result = normaliseEofToBaseline(claude, baseline);
  assert.equal(result.beforeCount, 0);
  assert.equal(result.afterCount, 1);
  assert.equal(result.text, claude + "\n");
  assert.equal(result.changed, true);
  assert.equal(result.contentPrefix, "---\ntitle: x\n---\n\nBody line.");
});

run("one extra final newline is removed to match baseline", () => {
  const baseline = "---\ntitle: x\n---\n\nBody line.\n";
  const claude = "---\ntitle: x\n---\n\nBody line.\n\n";
  const result = normaliseEofToBaseline(claude, baseline);
  assert.equal(result.beforeCount, 2);
  assert.equal(result.afterCount, 1);
  assert.equal(result.text, baseline);
  assert.equal(result.changed, true);
});

run("multiple extra final newlines are removed to match baseline", () => {
  const baseline = "---\ntitle: x\n---\n\nBody line.\n";
  const claude = "---\ntitle: x\n---\n\nBody line.\n\n\n\n";
  const result = normaliseEofToBaseline(claude, baseline);
  assert.equal(result.beforeCount, 4);
  assert.equal(result.afterCount, 1);
  assert.equal(result.text, baseline);
});

run("already matching EOF is unchanged", () => {
  const text = "---\ntitle: x\n---\n\nBody line.\n";
  const result = normaliseEofToBaseline(text, text);
  assert.equal(result.beforeCount, 1);
  assert.equal(result.afterCount, 1);
  assert.equal(result.text, text);
  assert.equal(result.changed, false);
});

run("internal blank-line mismatch is not repaired by EOF normaliser", () => {
  const baseline = "---\ntitle: x\n---\n\nPara one.\n\nPara two.\n";
  const claude = "---\ntitle: x\n---\n\nPara one.\nPara two.";
  const beforeContent = splitContentAndEofNewlines(claude).content;
  const result = normaliseEofToBaseline(claude, baseline);
  assert.equal(result.contentPrefix, beforeContent);
  assert.ok(result.text.includes("Para one.\nPara two."));
  assert.ok(!result.text.includes("Para one.\n\nPara two."));
  assert.equal(result.afterCount, 1);
  assert.equal(result.beforeCount, 0);
});

run("contract integration leaves internal mismatch for validator", () => {
  const root = mkdtempSync(join(tmpdir(), "rcm-eof-test-"));
  const suit = "swords";
  const slug = "test-card";
  const claudeDir = join(root, "editorial/repeating-card-library/claude", suit);
  const archiveDir = join(root, "editorial/repeating-card-library/archive", suit, slug);
  const contractDir = join(root, "editorial/repeating-card-library/contracts", suit);
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(archiveDir, { recursive: true });
  mkdirSync(contractDir, { recursive: true });

  const baselineBody = [
    "## Core Repeating Message",
    "",
    "> Quote line.",
    "",
    "First paragraph.",
    "",
    "Second paragraph.",
  ].join("\n");

  const claudeBody = [
    "## Core Repeating Message",
    "",
    "> Quote line.",
    "",
    "First paragraph.",
    "Second paragraph.",
  ].join("\n");

  const frontmatter = "---\ntitle: Test\nslug: test-card\n---\n";
  const baselinePath = join(archiveDir, "v1-original.md");
  const claudePath = join(claudeDir, `${slug}.md`);
  const contractPath = join(contractDir, `${slug}.yaml`);

  writeFileSync(baselinePath, `${frontmatter}${baselineBody}\n`, "utf8");
  writeFileSync(claudePath, `${frontmatter}${claudeBody}`, "utf8");
  writeFileSync(
    contractPath,
    `collection_id: ${suit}/${slug}\nextracted_baseline: ${baselinePath.replace(/\\/g, "/")}\n`,
    "utf8",
  );

  const report = normaliseClaudeWorkingCopy({
    contractPath,
    repoRoot: root,
  });

  assert.equal(report.changed, true);
  assert.equal(report.beforeCount, 0);
  assert.equal(report.afterCount, 1);

  const onDisk = readFileSync(claudePath, "utf8");
  assert.ok(onDisk.includes("First paragraph.\nSecond paragraph."));
  assert.ok(!onDisk.includes("First paragraph.\n\nSecond paragraph."));

  const validate = spawnSync(
    process.execPath,
    [
      join(REPO_ROOT, "scripts/validate-rcm-editorial-reinsertion.mjs"),
      "--contract",
      contractPath,
      claudePath,
    ],
    { encoding: "utf8", cwd: REPO_ROOT },
  );

  assert.notEqual(validate.status, 0, "validator must still fail on internal blank-line mismatch");
  assert.match(validate.stderr + validate.stdout, /BLOCKED|validation failed/i);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
