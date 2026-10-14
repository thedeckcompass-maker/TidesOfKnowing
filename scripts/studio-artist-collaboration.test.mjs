import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");
const migration = read("supabase/migrations/20260923040000_deck_studio_artist_collaboration.sql");
const artistPage = read("src/pages/artists/collaborate/index.astro");
const artistSubmit = read("src/pages/api/artists/collaborate.ts");
const artistResponse = read("src/pages/api/artists/introductions/[id].ts");
const directory = read("src/pages/studio/artists/index.astro");
const creatorRequest = read("src/pages/api/studio/artists/introductions.ts");
const creatorResponse = read("src/pages/api/studio/artists/introductions/[id].ts");
const adminPage = read("src/pages/studio/admin/artists/index.astro");
const adminAction = read("src/pages/api/studio/admin/artists/[id].ts");
const validation = read("src/lib/studio/validation.ts");
const header = read("src/components/studio/StudioHeader.astro");

for (const table of ["studio_artist_profiles", "studio_artist_contacts", "studio_artist_shortlists", "studio_artist_introductions"]) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
}
assert.match(migration, /jsonb_array_length\(portfolio_examples\) between 6 and 8/);
assert.match(migration, /process_disclosure in \('human_created','digital_non_generative','ai_assisted','generative_ai'\)/);
assert.match(migration, /Private artist contact details/);
assert.match(migration, /Direct contact is disclosed by the server only after artist acceptance/);
assert.match(migration, /status = 'approved' and public\.studio_has_read_access\(\)/);
assert.match(migration, /Introduction requests require an owned project and an approved artist/);
assert.match(migration, /Artists may accept, decline or request more information/);

assert.match(validation, /Provide between six and eight portfolio examples/);
assert.match(validation, /display_rights_confirmed/);
assert.match(validation, /direct_contract_confirmed/);
assert.match(artistPage, /Artists retain ownership and grant only limited display rights/);
assert.match(artistPage, /private contact email is not published/);
assert.match(artistPage, /acceptedCreatorEmails/);
assert.match(artistSubmit, /status: "submitted"/);
assert.match(artistResponse, /"accepted", "declined", "more_information"/);

assert.match(directory, /const safeColumns =/);
assert.doesNotMatch(directory.match(/const safeColumns =[^;]+;/)?.[0] ?? "", /contact_email/);
assert.match(directory, /accepted\.length/);
assert.match(directory, /Request an introduction/);
assert.match(directory, /contracts and payments are agreed directly/);
assert.match(creatorRequest, /parseStudioArtistIntroduction/);
assert.match(creatorResponse, /status: "withdrawn"/);
assert.match(adminPage, /limited directory display/);
assert.match(adminPage, /Private contact details are excluded/);
assert.match(adminAction, /isAdminProfile/);
assert.match(adminAction, /status: action === "approve" \? "approved" : "declined"/);
assert.match(header, /\/studio\/artists\//);

for (const source of [migration, artistPage, artistSubmit, artistResponse, directory, creatorRequest, creatorResponse, adminPage, adminAction]) {
  assert.doesNotMatch(source, /sk_live_|repeating-card-meanings|community_posts/i);
}

console.log("Deck Creator Studio artist collaboration contracts: passed");
