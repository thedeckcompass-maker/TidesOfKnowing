import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

const migration = read("supabase/migrations/20260922173000_deck_studio_journal_foundation.sql");
const journalIndex = read("src/pages/studio/projects/[id]/journal/index.astro");
const journalEditor = read("src/pages/studio/projects/[id]/journal/[entryId].astro");
const journalCreate = read("src/pages/api/studio/projects/[id]/journal.ts");
const journalUpdate = read("src/pages/api/studio/journal/[id].ts");
const validation = read("src/lib/studio/validation.ts");
const queries = read("src/lib/studio/queries.ts");
const header = read("src/components/studio/StudioHeader.astro");

assert.match(migration, /create table if not exists public\.studio_journal_entries/);
assert.match(migration, /alter table public\.studio_journal_entries enable row level security/);
assert.match(migration, /Creators can manage own Studio journal/);
assert.match(migration, /studio_owns_project\(project_id\)/);
assert.match(migration, /studio_validate_journal_links/);
assert.match(migration, /Journal card link must belong to the same Studio project/);
assert.match(migration, /Journal guidebook link must belong to the same Studio project/);
assert.match(migration, /selected_for_process boolean not null default false/);
assert.match(migration, /remains private and does not publish source entries/);
assert.doesNotMatch(migration, /to anon|to public/i);

for (const page of [journalIndex, journalEditor]) {
  assert.match(page, /studioAccessResponse/);
  assert.match(page, /metaRobots="noindex, nofollow"/);
  assert.match(page, /private/i);
}

assert.match(journalIndex, /Process board/);
assert.match(journalIndex, /does not publish or share it/);
assert.match(journalIndex, /name="linked_card_id"/);
assert.match(journalIndex, /name="linked_section_id"/);
assert.match(journalIndex, /name="tags"/);
assert.match(journalIndex, /name="selected_for_process"/);
assert.match(journalEditor, /does not create a public excerpt or community post/);
assert.match(journalEditor, /checked=\{entry\.selected_for_process\}/);

assert.match(validation, /parseStudioJournalEntry/);
assert.match(validation, /STUDIO_JOURNAL_TAGS/);
assert.match(validation, /form\.getAll\("tags"\)/);
assert.match(validation, /Choose valid journal tags/);
assert.match(queries, /getStudioJournalEntries/);
assert.match(queries, /getStudioJournalEntry/);
assert.match(journalCreate, /insert\(\{ project_id: projectId, \.\.\.parsed\.value \}\)/);
assert.match(journalUpdate, /\.eq\("project_id", projectId\)/);
assert.match(header, /journal\//);

for (const source of [migration, journalIndex, journalEditor, journalCreate, journalUpdate, validation, queries, header]) {
  assert.doesNotMatch(source, /repeating-card-meanings/);
}

console.log("Deck Creator Studio journal foundation contracts: passed");
