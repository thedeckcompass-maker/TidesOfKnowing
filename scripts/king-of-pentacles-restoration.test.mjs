#!/usr/bin/env node
import assert from "node:assert/strict";
import { loadInputs, validateRestoration } from "./validate-king-of-pentacles-restoration.mjs";

const inputs = loadInputs();
const map = JSON.parse(inputs.mapRaw);
assert.equal(validateRestoration(inputs).passed, true, "Exact independently approved restoration must pass.");
console.log("ok — exact approved restoration, protected shell and all 165 units pass");

function reject(name, changes, code) {
  const result = validateRestoration({ ...inputs, ...changes });
  assert.equal(result.passed, false, `${name} must fail`);
  assert.ok(result.errors.some((error) => error.code === code), `${name} must fail the specific ${code} guard, not only its whole-file hash`);
  console.log(`ok — ${name} rejected by ${code}`);
}

reject("wrong word in approved prose", {
  candidateText: inputs.candidateText.replace(map.sections["Core Repeating Message"][0], `${map.sections["Core Repeating Message"][0]} Unapproved wording.`),
}, "approved-map-unit");

reject("missing Core unit and wrong paragraph count", {
  candidateText: inputs.candidateText.replace(`${map.sections["Core Repeating Message"][1]}\n\n`, ""),
}, "core-count");

const first = map.sections["Core Repeating Message"][0];
const second = map.sections["Core Repeating Message"][1];
reject("reordered equal-count Core units", {
  candidateText: inputs.candidateText.replace(first, "__TEMP_APPROVED_UNIT__").replace(second, first).replace("__TEMP_APPROVED_UNIT__", second),
}, "approved-map-unit");

reject("protected slug edit", {
  candidateText: inputs.candidateText.replace("slug: repeating-card-meanings/king-of-pentacles", "slug: repeating-card-meanings/changed-king"),
}, "protected-frontmatter");

reject("renamed protected heading", {
  candidateText: inputs.candidateText.replace("## Core Repeating Message", "## Changed Core Message"),
}, "protected-headings");

reject("missing integration action", {
  candidateText: inputs.candidateText.replace(`**${map.actions.at(-1).label}**`, map.actions.at(-1).label),
}, "action-count");

reject("wrong question numbering", {
  candidateText: inputs.candidateText.replace(`2. ${map.sections["Reflective Questions"][1]}`, `3. ${map.sections["Reflective Questions"][1]}`),
}, "question-order");

reject("wrong responsibility-list numbering", {
  candidateText: inputs.candidateText.replace("2. work that remains your responsibility but can be delegated;", "4. work that remains your responsibility but can be delegated;"),
}, "responsibility-list");

reject("modified independent authority map", {
  mapRaw: inputs.mapRaw.replace(map.summary, `${map.summary} Unapproved map change.`),
}, "authority-map-hash");

reject("broadened frontmatter permission", {
  contract: { ...inputs.contract, allowed_frontmatter_edits: [...inputs.contract.allowed_frontmatter_edits, "slug"] },
}, "contract-frontmatter");

reject("different production target", {
  contract: { ...inputs.contract, production_target: "src/content/repeating-card-meanings/majors/the-fool.md" },
}, "contract-target");

console.log("12 passed, 0 failed (one positive and eleven independent negative guards).");
