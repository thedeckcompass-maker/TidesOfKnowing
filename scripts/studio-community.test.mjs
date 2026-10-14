import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const migration = read("supabase/migrations/20260923053000_deck_studio_community.sql");
const communityTypes = read("src/lib/community/types.ts");
const communityValidation = read("src/lib/community/validation.ts");
const communityForm = read("src/components/community/CommunityPostForm.astro");
const communityRoom = read("src/pages/community/sections/[section]/index.astro");
const journalEditor = read("src/pages/studio/projects/[id]/journal/[entryId].astro");
const shareRoute = read("src/pages/api/studio/journal/excerpts/[excerptId]/community.ts");
const withdrawRoute = read("src/pages/api/studio/community-shares/[shareId]/withdraw.ts");

assert.match(migration, /'deck-creation'/);
assert.match(migration, /add column if not exists audience text not null default 'public'/);
assert.match(migration, /alter column audience set default 'members'/);
assert.match(migration, /create table if not exists public\.studio_community_shares/);
assert.match(migration, /studio_share_journal_excerpt/);
assert.match(migration, /studio_withdraw_community_share/);
assert.match(migration, /source_kind = 'studio_excerpt'/);
assert.match(migration, /public_visibility_confirmed/);
assert.match(migration, /audience = 'public' or public\.is_active_member\(\)/);
assert.match(migration, /title_snapshot/);
assert.match(migration, /excerpt_snapshot/);
assert.doesNotMatch(migration, /studio_journal_photos[\s\S]*community-spread-images/);

assert.match(communityTypes, /"deck-creation"/);
assert.match(communityTypes, /COMMUNITY_AUDIENCES/);
assert.match(communityTypes, /DECK_CREATION_TOPICS/);
assert.match(communityValidation, /Confirm that this post may be visible publicly/);
assert.match(communityForm, /New discussions stay inside the member community/);
assert.match(communityForm, /name="confirmPublic"/);
assert.match(communityRoom, /The Studio holds private project work/);

assert.match(journalEditor, /Share separate copy/);
assert.match(journalEditor, /My source journal, project and photographs remain private/);
assert.match(journalEditor, /Withdraw community copy/);
assert.match(shareRoute, /parseStudioCommunityShare/);
assert.match(shareRoute, /studio_share_journal_excerpt/);
assert.match(withdrawRoute, /studio_withdraw_community_share/);

for (const source of [migration, communityTypes, communityValidation, communityForm, communityRoom, journalEditor, shareRoute, withdrawRoute]) {
  assert.doesNotMatch(source, /vbdqvjvhjleqdadiiqjx|stripe\.com|repeating-card-meanings/i);
}

console.log("Deck Creator Studio community and controlled sharing contracts: passed");
