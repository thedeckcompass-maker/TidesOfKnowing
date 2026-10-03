#!/usr/bin/env node
/**
 * Strict one-card exception for the owner's independently approved King restoration.
 * The shared prose-only reinsertion validator remains unchanged. This gate compares
 * every restored prose unit with the separately captured approval map, and protects
 * the actual pre-restoration production shell. The candidate is never its baseline.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONTRACT = "editorial/repeating-card-library/contracts/pentacles/king-of-pentacles.yaml";
const CARD = "pentacles/king-of-pentacles";
const ALLOWED = ["summary", "featuredSnippetAnswer", "answerEngineSummary"];
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function splitMarkdown(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error("A complete LF-delimited YAML frontmatter block is required.");
  const fields = [...match[1].matchAll(/^([A-Za-z_][\w]*):[^\n]*(?:\n(?![A-Za-z_][\w]*:)[^\n]*)*/gm)]
    .map((m) => ({ key: m[1], raw: m[0] }));
  return { fields, data: yaml.load(match[1]), body: text.slice(match[0].length) };
}

function headingSections(body) {
  const matches = [...body.matchAll(/^(#{1,6}) (.+)$/gm)];
  return matches.map((m, i) => ({
    marker: m[0], level: m[1].length, title: m[2],
    content: body.slice(m.index + m[0].length, matches[i + 1]?.index ?? body.length),
  }));
}

function cleanSection(text) {
  return text.replace(/\n---\s*$/, "").trim();
}

function blocks(text) {
  const clean = cleanSection(text);
  return clean ? clean.split(/\n[\t ]*\n/).map((p) => p.trim().replace(/ {2}\n/g, "\n")) : [];
}

function actionBlocks(text) {
  const clean = cleanSection(text);
  const labels = [...clean.matchAll(/^\*\*([^\n]+)\*\*$/gm)];
  if (labels.length && clean.slice(0, labels[0].index).trim()) {
    throw new Error("Unmapped text precedes the integration actions.");
  }
  return labels.map((m, i) => ({
    label: m[1],
    paragraphs: blocks(clean.slice(m.index + m[0].length, labels[i + 1]?.index ?? clean.length)),
  }));
}

export function loadInputs(contractPath = CONTRACT) {
  const contract = yaml.load(fs.readFileSync(path.resolve(ROOT, contractPath), "utf8"));
  return {
    contract,
    baselineText: fs.readFileSync(path.resolve(ROOT, contract.extracted_baseline), "utf8"),
    mapRaw: fs.readFileSync(path.resolve(ROOT, contract.approved_map), "utf8"),
    candidateText: fs.readFileSync(path.resolve(ROOT, contract.approved_source), "utf8"),
  };
}

export function validateRestoration({ contract, baselineText, mapRaw, candidateText }) {
  const errors = [];
  const units = [];
  const fail = (code, message) => errors.push({ code, message });
  const check = (condition, code, message) => { if (!condition) fail(code, message); };
  const unit = (key, actual, expected) => {
    units.push({ key, approved_sha256: sha256(expected), candidate_sha256: sha256(actual ?? "") });
    check(actual === expected, "approved-map-unit", `${key}: content differs from the independent approved map.`);
  };

  check(contract.collection_id === CARD && contract.validation_mode === "independently_approved_map_restoration",
    "contract-scope", "This validator is restricted to the explicitly authorised King of Pentacles restoration.");
  check(contract.production_target === "src/content/repeating-card-meanings/pentacles/king-of-pentacles.md",
    "contract-target", "The production target must be the existing King of Pentacles source path.");
  check(JSON.stringify(contract.allowed_frontmatter_edits) === JSON.stringify(ALLOWED),
    "contract-frontmatter", "Only the three explicitly approved metadata values may change.");
  check(sha256(baselineText) === contract.previous_production_sha256, "baseline-hash", "Pre-restoration production snapshot hash differs.");
  check(sha256(mapRaw) === contract.approved_map_sha256, "authority-map-hash", "Independent approval-map hash differs.");
  check(sha256(candidateText) === contract.approved_source_sha256, "accepted-source-hash", "Candidate is not the exact accepted source.");

  try {
    const map = JSON.parse(mapRaw);
    const baseline = splitMarkdown(baselineText);
    const candidate = splitMarkdown(candidateText);
    const oldSections = headingSections(baseline.body);
    const sections = headingSections(candidate.body);
    const expected = contract.approved_structure;
    const keys = (value) => value.fields.map((f) => f.key);
    check(JSON.stringify(keys(candidate)) === JSON.stringify(keys(baseline)), "protected-field-order", "Frontmatter keys/order changed.");
    check(candidate.fields.length === expected.metadata_key_count, "metadata-count", "Unexpected frontmatter key count.");
    for (const field of baseline.fields) {
      if (!ALLOWED.includes(field.key)) {
        check(candidate.fields.find((f) => f.key === field.key)?.raw === field.raw,
          "protected-frontmatter", `Protected raw field ${field.key} changed.`);
      }
    }
    for (const key of ALLOWED) {
      check(candidate.data[key] === map[key], "approved-metadata", `${key} differs from its independently approved map value.`);
    }
    check(JSON.stringify(sections.map((s) => s.marker)) === JSON.stringify(oldSections.map((s) => s.marker)),
      "protected-headings", "Heading text, level or order changed.");
    check(sections.filter((s) => s.level === 1).length === expected.h1_count, "h1-count", "Unexpected H1 count.");
    check(sections.filter((s) => s.level === 2).length === expected.h2_count, "h2-count", "Unexpected H2 count.");
    const separators = (s) => (s.match(/^---$/gm) ?? []).length;
    check(separators(candidate.body) === expected.separator_count && separators(candidate.body) === separators(baseline.body),
      "protected-separators", "Section separator count changed.");
    for (let i = 0; i < oldSections.length; i++) {
      check(/\n---\s*$/.test(sections[i]?.content ?? "") === /\n---\s*$/.test(oldSections[i].content),
        "protected-separator-position", `Separator position changed after ${oldSections[i].title}.`);
    }
    const links = (s) => s.match(/!?\[[^\]]*\]\([^)]*\)/g) ?? [];
    check(JSON.stringify(links(candidate.body)) === JSON.stringify(links(baseline.body)), "protected-links", "Markdown links or image references changed.");

    const intro = blocks(sections[0]?.content ?? "");
    check(intro.length === expected.introduction_units && map.image.length === expected.introduction_units,
      "introduction-count", "The approved two-unit introduction is incomplete.");
    check(intro[0]?.startsWith("> "), "introduction-quote", "The first approved image unit must remain a blockquote.");
    unit("image.0", intro[0]?.replace(/^> /, ""), map.image[0]);
    unit("image.1", intro[1], map.image[1]);
    for (const section of sections.slice(1).filter((s) => s.level === 1)) {
      check(cleanSection(section.content) === "", "protected-group-heading", `Unmapped content under ${section.title}.`);
    }
    const sectionNames = sections.filter((s) => s.level === 2 && s.title !== "Practical Integration Actions").map((s) => s.title);
    check(JSON.stringify(Object.keys(map.sections)) === JSON.stringify(sectionNames), "map-section-order", "Map section names/order do not match the protected shell.");
    for (const [title, approved] of Object.entries(map.sections)) {
      const actual = blocks(sections.find((s) => s.title === title)?.content ?? "");
      check(actual.length === approved.length, "section-unit-count", `${title}: expected ${approved.length} exact source-order units; found ${actual.length}.`);
      if (title === "Core Repeating Message") check(actual.length === expected.core_paragraphs, "core-count", "Expected 24 restored Core paragraphs.");
      if (title === "Reflective Questions") check(actual.length === expected.reflective_questions, "question-count", "Expected ten approved questions.");
      approved.forEach((text, i) => {
        let value = actual[i];
        if (title === "Reflective Questions") {
          check(value?.startsWith(`${i + 1}. `), "question-order", `Question ${i + 1} numbering/order changed.`);
          value = value?.replace(/^\d+\. /, "");
        }
        unit(`sections.${title}.${i}`, value, text);
      });
    }
    const actions = actionBlocks(sections.find((s) => s.title === "Practical Integration Actions")?.content ?? "");
    check(actions.length === expected.integration_actions && map.actions.length === expected.integration_actions,
      "action-count", "Expected seven approved integration actions.");
    map.actions.forEach((approved, ai) => {
      const actual = actions[ai];
      check(actual?.label === approved.label, "action-label", `Action ${ai + 1} label differs from the approved map.`);
      check(actual?.paragraphs.length === approved.paragraphs.length, "action-unit-count", `Action ${ai + 1} has missing or extra prose units.`);
      approved.paragraphs.forEach((text, pi) => {
        let value = actual?.paragraphs[pi];
        if (ai === 2 && pi === 1) {
          const lines = value?.split("\n") ?? [];
          check(lines.length === expected.responsibility_list_items && lines.every((line, i) => line.startsWith(`${i + 1}. `)),
            "responsibility-list", "The approved responsibility list must contain ordered items 1–3.");
          value = lines.map((line) => line.replace(/^\d+\. /, "")).join("\n");
        }
        unit(`actions.${ai}.paragraphs.${pi}`, value, text);
      });
    });
    check(units.length === expected.prose_units, "unit-total", "Expected all 165 independently approved prose units.");
    const oldContent = (title) => oldSections.find((s) => s.title === title)?.content ?? "";
    const deltas = {
      introduction_units: [blocks(oldSections[0]?.content ?? "").length, intro.length],
      core_paragraphs: [blocks(oldContent("Core Repeating Message")).length, blocks(sections.find((s) => s.title === "Core Repeating Message")?.content ?? "").length],
      integration_actions: [blocks(oldContent("Practical Integration Actions")).filter((p) => /^\*\*[^*]+\*\*/.test(p)).length, actions.length],
      reflective_questions: [blocks(oldContent("Reflective Questions")).length, blocks(sections.find((s) => s.title === "Reflective Questions")?.content ?? "").length],
    };
    for (const [key, actual] of Object.entries(deltas)) {
      check(JSON.stringify(actual) === JSON.stringify(contract.approved_restoration_deltas[key]),
        "approved-structural-delta", `${key}: the explicit old-to-new restoration delta does not match.`);
    }
    check((candidateText.match(/\n*$/)?.[0].length ?? 0) === (baselineText.match(/\n*$/)?.[0].length ?? 0),
      "eof-pattern", "EOF pattern must match actual pre-restoration production.");
  } catch (error) {
    fail("parse-or-structure", error.message);
  }
  return { passed: errors.length === 0, card_id: CARD, errors, units, candidate_sha256: sha256(candidateText), approval_map_sha256: sha256(mapRaw) };
}

function main() {
  const args = process.argv.slice(2);
  const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? null : args[index + 1]; };
  const inputs = loadInputs(value("--contract") ?? CONTRACT);
  if (value("--candidate")) inputs.candidateText = fs.readFileSync(path.resolve(ROOT, value("--candidate")), "utf8");
  const result = validateRestoration(inputs);
  if (value("--report")) fs.writeFileSync(path.resolve(ROOT, value("--report")), `${JSON.stringify(result, null, 2)}\n`);
  if (!result.passed) {
    console.error("BLOCKED: King-specific approved restoration gate failed. No production write is permitted.");
    for (const error of result.errors) console.error(`[${error.code}] ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log("PASS: King-specific approved-map restoration gate.");
  console.log("165 source-order prose units match the independent approval map exactly; protected shell and three metadata mappings verified.");
  console.log("This is the documented owner-approved structural restoration exception; the shared prose-only validator is unchanged.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
