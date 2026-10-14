import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");
const migration = read("supabase/migrations/20260923003000_deck_studio_programme_foundation.sql");
const page = read("src/pages/studio/projects/[id]/programme/index.astro");
const start = read("src/pages/api/studio/projects/[id]/programme.ts");
const progress = read("src/pages/api/studio/projects/[id]/programme/[week].ts");
const queries = read("src/lib/studio/queries.ts");
const validation = read("src/lib/studio/validation.ts");
const header = read("src/components/studio/StudioHeader.astro");

const moduleSeed = migration.split("on conflict (week_number)")[0];
assert.equal([...moduleSeed.matchAll(/^\s+\((\d+),\s*'/gm)].length, 12);
for (let week = 1; week <= 12; week += 1) {
  assert.match(moduleSeed, new RegExp(`^\\s+\\(${week},\\s*'`, "m"));
}
assert.match(migration, /studio_start_programme\(target_project_id uuid\)/);
assert.match(migration, /values \(target_project_id, current_date\)/);
assert.match(migration, /studio_validate_programme_progress/);
assert.match(migration, /programme_start \+ \(\(new\.week_number - 1\) \* 7\)/);
assert.match(migration, /public\.studio_has_write_access\(\)/);
assert.doesNotMatch(migration, /for insert[\s\S]{0,120}studio_programme_enrolments/i);
assert.match(page, /Twelve-week programme/);
assert.match(page, /Complete when/);
assert.match(page, /Safe to leave open/);
assert.match(page, /Next production risk/);
assert.match(page, /pathwayGuidance\(module\)/);
assert.match(page, /Available \{unlockDate/);
assert.match(start, /\.rpc\("studio_start_programme"/);
assert.match(progress, /week < 1 \|\| week > 12/);
assert.match(progress, /today < unlockDate/);
assert.match(progress, /onConflict: "project_id,week_number"/);
assert.match(queries, /getStudioProgramme/);
assert.match(validation, /parseStudioProgrammeProgress/);
assert.match(header, />Programme</);

for (const source of [migration, page, start, progress, queries, validation, header]) {
  assert.doesNotMatch(source, /repeating-card-meanings|community_posts|sk_live_/i);
}

console.log("Deck Creator Studio twelve-week programme contracts: passed");
