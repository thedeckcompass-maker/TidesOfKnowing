import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { diffLines, matchingEarlierVersion, versionChanges, versionFields } from "../src/lib/studio/versionHistory.ts";

const root = new URL("../", import.meta.url).pathname;
const read = (name) => readFileSync(join(root, name), "utf8");
const v1 = { id: "first", version_number: 1, snapshot: { title: "Test", status: "outline", content: { meaning: "First thought" } } };
const v2 = { id: "second", version_number: 2, snapshot: { title: "Test", status: "draft", content: { meaning: "First thought\nSecond line" } } };
const v3 = { id: "third", version_number: 3, snapshot: { title: "Test", status: "review", content: { meaning: "Different thought" } } };
const v4 = { id: "fourth", version_number: 4, snapshot: structuredClone(v1.snapshot) };
const history = [v4, v3, v2, v1];

assert.deepEqual(versionChanges(v1.snapshot, v2.snapshot, "card").map((change) => change.label), ["Status", "Core meaning"]);
assert.equal(matchingEarlierVersion(v4, history), 1, "A historic restore may be identified as matching content, not asserted as proven provenance.");
assert.equal(matchingEarlierVersion(v2, history), null);
assert.equal(versionFields(v1.snapshot, "card").find((field) => field.key === "meaning")?.value, "First thought");
assert.deepEqual(diffLines("line one\nline two", "line one\nline three").map(({ kind }) => kind), ["same", "removed", "added"]);

const migration = read("supabase/migrations/20260923183000_deck_studio_restore_provenance.sql");
for (const functionName of ["studio_restore_card_version", "studio_restore_guidebook_version"]) {
  assert.match(migration, new RegExp(`function public\\.${functionName}`));
}
assert.match(migration, /expected_current_version/);
assert.match(migration, /owner_id = auth\.uid\(\)/);
assert.match(migration, /get diagnostics marked = row_count/);
assert.match(read("src/pages/api/studio/cards/[id]/restore.ts"), /confirm_restore/);
assert.match(read("src/pages/api/studio/guidebook/[id]/restore.ts"), /confirm_restore/);
console.log("Deck Creator Studio version comparison and restoration contracts: passed");
