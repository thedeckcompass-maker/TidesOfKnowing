import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");
const migration = read("supabase/migrations/20260923023000_deck_studio_support_workflows.sql");
const page = read("src/pages/studio/projects/[id]/support/index.astro");
const create = read("src/pages/api/studio/projects/[id]/support.ts");
const withdraw = read("src/pages/api/studio/support/[id].ts");
const adminPage = read("src/pages/studio/admin/support/index.astro");
const adminAction = read("src/pages/api/studio/admin/support/[id].ts");
const header = read("src/components/studio/StudioHeader.astro");

assert.match(migration, /unique \(owner_id, support_week\)/);
assert.match(migration, /An active matching support entitlement is required/);
assert.match(migration, /Circle support accepts a group-safe submission and never grants manuscript access/);
assert.match(migration, /cardinality\(new\.review_scopes\) <> 0/);
assert.match(migration, /not \('project' = any\(new\.review_scopes\)\)/);
assert.match(migration, /new\.access_expires_at > new\.accepted_at \+ interval '14 days'/);
assert.match(migration, /Creators may only withdraw a support request/);
assert.match(migration, /studio_support_scope_allows/);
assert.match(migration, /target_scope in \('project','cards','guidebook'\)/);
assert.doesNotMatch(migration, /studio_support_scope_allows\(project_id, 'journal'\)/);
assert.doesNotMatch(migration, /studio_support_scope_allows\(project_id, 'media'\)/);

assert.match(page, /No other project material is included/);
assert.match(page, /Creator Journal entries, photographs and controlled excerpts are excluded/);
assert.match(page, /purpose-specific access to the selected project areas/);
assert.match(page, /ends on completion, withdrawal or after 14 days/);
assert.match(create, /planCode !== "circle" && planCode !== "private"/);
assert.match(create, /group_share_confirmed/);
assert.match(create, /reviewScopes\.includes\("project"\)/);
assert.match(create, /error\.code === "23505"/);
assert.match(withdraw, /status: "withdrawn"/);
assert.match(withdraw, /access_expires_at: now/);

assert.match(adminPage, /Deliberately submitted material only/);
assert.match(adminPage, /Journal entries, photographs and controlled excerpts are never included/);
assert.match(adminPage, /Complete and close access/);
assert.match(adminAction, /isAdminProfile/);
assert.match(adminAction, /14 \* 24 \* 60 \* 60 \* 1000/);
assert.match(adminAction, /supportRequest\.facilitator_id !== locals\.user\.id/);
assert.match(adminAction, /status: "completed"/);
assert.match(adminAction, /access_expires_at: completedAt/);
assert.match(header, />Support</);

for (const source of [migration, page, create, withdraw, adminPage, adminAction, header]) {
  assert.doesNotMatch(source, /repeating-card-meanings|community_posts|sk_live_/i);
}

console.log("Deck Creator Studio plan support workflow contracts: passed");
