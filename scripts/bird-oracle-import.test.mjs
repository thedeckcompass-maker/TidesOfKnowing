import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildAotearoaBirdOraclePlan,
  deterministicImportTargetId,
} from "./lib/aotearoa-bird-oracle-importer.mjs";

const root = mkdtempSync(join(tmpdir(), "bird-import-test-"));
const content = join(root, "src", "content");
for (const directory of ["birds", "tarot", "chapters"]) mkdirSync(join(content, directory), { recursive: true });
mkdirSync(join(root, "src", "config"), { recursive: true });

writeFileSync(join(root, "src", "config", "groups.json"), JSON.stringify({ groups: [{ name: "Test Group", sortOrder: 1, description: "Test family" }] }));
writeFileSync(join(content, "birds", "g1-n01.md"), `---
title: Test Navigator
card_id: G1-N01
card_number: 1
group: Test Group
group_number: 1
status: draft
keywords: [clarity]
oracle_meaning: Listen carefully
shadow_expression: Rushing
author_notes_private: Private note
editorial_notes: Editorial note
tarot_primary_card: The Fool
tarot_primary_suit: Major Arcana
tarot_primary_slug: the-fool
image_status: not_sourced
image_source: tbd
image_rights: not_addressed
image_credit: ''
image_type: pending
toc_position: null
---
Exact bird wording.
`);
writeFileSync(join(content, "tarot", "the-fool.md"), `---
title: The Fool
card_number: 1
bird_slug: g1-n01
status: notes
toc_position: null
---
Exact tarot wording.
`);
writeFileSync(join(content, "chapters", "opening.md"), `---
title: Opening
chapter_type: introduction
status: draft
toc_position: null
---
Exact chapter wording.
`);

try {
  const plan = buildAotearoaBirdOraclePlan(root, { sample: "representative" });
  const repeated = buildAotearoaBirdOraclePlan(root, { sample: "representative" });
  assert.equal(plan.inventory.sourceBirds, 1);
  assert.equal(plan.cards.length, 1);
  assert.equal(plan.guidebookSections.length, 3);
  assert.equal(plan.reconciliation.silentDrops, 0);
  assert.equal(plan.cards[0].value.content.custom.aotearoa_bird_oracle.source_body_markdown.trim(), "Exact bird wording.");
  assert.equal(plan.guidebookSections.some((section) => section.value.body_markdown.trim() === "Exact tarot wording."), true);
  assert.equal(plan.exceptions.filter((item) => item.code === "UNASSIGNED_TOC_POSITION").length, 3);
  assert.deepEqual(repeated.cards.map((card) => card.sourceKey), plan.cards.map((card) => card.sourceKey));
  assert.deepEqual(repeated.guidebookSections.map((section) => section.sourceKey), plan.guidebookSections.map((section) => section.sourceKey));
  const cardTargetId = deterministicImportTargetId("11111111-1111-4111-8111-111111111111", "card", "bird:G1-N01");
  assert.equal(cardTargetId, deterministicImportTargetId("11111111-1111-4111-8111-111111111111", "card", "bird:G1-N01"));
  assert.notEqual(cardTargetId, deterministicImportTargetId("11111111-1111-4111-8111-111111111111", "guidebook_section", "bird:G1-N01"));
  assert.match(cardTargetId, /^[a-f0-9]{8}-[a-f0-9]{4}-8[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  const importer = readFileSync(new URL("./import-aotearoa-bird-oracle.mjs", import.meta.url), "utf8");
  assert.match(importer, /deterministicImportTargetId\(projectId, targetType, item\.sourceKey\)/);
  assert.match(importer, /\.upsert\(\{ id: targetId, project_id: projectId/);
  assert.doesNotMatch(importer, /\.insert\(\{ project_id: projectId, \.\.\.value \}\)/);
  const migration = readFileSync(new URL("../supabase/migrations/20260922050000_deck_studio_import_provenance.sql", import.meta.url), "utf8");
  assert.match(migration, /unique \(project_id, source_system, source_key\)/);
  assert.match(migration, /Creators can read own Studio import records/);
  assert.doesNotMatch(migration, /studio_import_records for (insert|update|delete|all)/i);
  assert.doesNotMatch(migration, /add column[^;]*bird_/i);
  console.log("Aotearoa Bird Oracle importer contracts: passed");
} finally {
  rmSync(root, { recursive: true, force: true });
}
