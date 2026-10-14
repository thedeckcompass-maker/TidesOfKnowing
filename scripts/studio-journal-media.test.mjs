import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");
const migration = read("supabase/migrations/20260922190000_deck_studio_journal_media.sql");
const media = read("src/lib/studio/journalMedia.ts");
const editor = read("src/pages/studio/projects/[id]/journal/[entryId].astro");
const upload = read("src/pages/api/studio/journal/[id]/photos.ts");
const remove = read("src/pages/api/studio/journal/photos/[photoId].ts");
const excerpts = read("src/pages/api/studio/journal/[id]/excerpts.ts");
const exportRoute = read("src/pages/api/studio/journal/excerpts/[excerptId]/export/[format].ts");

assert.match(migration, /'studio-journal-photos'.*false.*6291456/s);
assert.match(migration, /create table if not exists public\.studio_journal_photos/);
assert.match(migration, /sort_order between 0 and 4/);
assert.match(migration, /create table if not exists public\.studio_journal_excerpts/);
assert.match(migration, /Separate controlled copies for deliberate export/);
assert.match(migration, /studio_owns_project\(project_id\)/);
assert.match(migration, /storage\.foldername\(name\)/);
assert.match(migration, /to_jsonb\(new\)->>'photo_id'/);
assert.doesNotMatch(migration, /for select\s+using \(bucket_id = 'studio-journal-photos'\);/i);
assert.match(media, /Exif\\x00\\x00\|GPSLatitude\|GPSLongitude/);
assert.match(media, /value\.type !== "image\/jpeg"/);
assert.match(editor, /createImageBitmap/);
assert.match(editor, /canvas\.toBlob\(resolve, "image\/jpeg"/);
assert.match(editor, /Originals are not uploaded/);
assert.match(editor, /up to five photographs/i);
assert.match(upload, /STUDIO_JOURNAL_PHOTO_LIMIT/);
assert.match(upload, /locals\.user\.id/);
assert.match(remove, /removeStudioJournalPhotoObject/);
assert.match(excerpts, /parseStudioJournalExcerpt/);
assert.match(editor, /separate export copy/);
assert.match(exportRoute, /Cache-Control": "private, no-store"/);
assert.match(exportRoute, /Content-Disposition/);

for (const source of [migration, media, editor, upload, remove, excerpts, exportRoute]) {
  assert.doesNotMatch(source, /repeating-card-meanings|community_posts|stripe/i);
}

console.log("Deck Creator Studio journal media and controlled excerpt contracts: passed");
