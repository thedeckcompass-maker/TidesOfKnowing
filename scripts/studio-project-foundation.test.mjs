import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");
const migration = read("supabase/migrations/20260922043000_deck_studio_project_foundation.sql");
const dashboard = read("src/pages/studio/projects/[id]/index.astro");
const cardEditor = read("src/pages/studio/projects/[id]/cards/[cardId].astro");
const guidebookEditor = read("src/pages/studio/projects/[id]/guidebook/[sectionId].astro");
const cardRestore = read("src/pages/api/studio/cards/[id]/restore.ts");
const guidebookRestore = read("src/pages/api/studio/guidebook/[id]/restore.ts");

const studioTables = [
  "studio_projects",
  "studio_card_families",
  "studio_cards",
  "studio_card_versions",
  "studio_guidebook_sections",
  "studio_guidebook_versions",
];

for (const table of studioTables) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
}

assert.match(migration, /owner_id = auth\.uid\(\)/);
assert.match(migration, /studio_owns_project\(project_id\)/);
assert.match(migration, /Creators can read own studio card versions/);
assert.match(migration, /Creators can read own guidebook versions/);
assert.doesNotMatch(migration, /for all[\s\S]{0,140}studio_(card|guidebook)_versions/i);
assert.match(migration, /studio_capture_card_version/);
assert.match(migration, /studio_capture_guidebook_version/);

assert.match(dashboard, /studioAccountAccessResponse/);
for (const source of [cardEditor, guidebookEditor]) {
  assert.match(source, /studioReadAccessResponse/);
  assert.match(source, /studioProjectWriteAccessResponse/);
}
for (const source of [dashboard, cardEditor, guidebookEditor]) {
  assert.match(source, /metaRobots="noindex, nofollow"/);
}

assert.match(dashboard, /Astro.redirect.*my-deck/);
assert.match(dashboard, /Oracle/);
assert.match(dashboard, /Tarot/);
assert.match(dashboard, /value="hybrid"/);
assert.match(cardEditor, /<CardWritingDesk/);
const writingDesk = read("src/components/studio/CardWritingDesk.astro");
assert.match(writingDesk, /name="research_notes"/);
assert.match(writingDesk, /name="cultural_context"/);
assert.match(writingDesk, /name="rights_status"/);
assert.match(guidebookEditor, /Markdown manuscript/);
assert.match(cardRestore, /studio_card_versions/);
assert.match(guidebookRestore, /studio_guidebook_versions/);

const repeatingCardChanges = [dashboard, cardEditor, guidebookEditor, migration]
  .filter((source) => source.includes("repeating-card-meanings"));
assert.equal(repeatingCardChanges.length, 0);

console.log("Deck Creator Studio project foundation contracts: passed");


