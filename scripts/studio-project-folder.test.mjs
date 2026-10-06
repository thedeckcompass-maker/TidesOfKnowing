import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { buildStudioProjectFolder, creatorMayExport } from "../src/lib/studio/projectFolder.ts";

const projectId = "project-owned-by-creator";
const cards = Array.from({ length: 78 }, (_, index) => ({ id: `card-${index}`, project_id: projectId, family_id: "family-1", title: `Bird ${index + 1}`, card_number: String(index + 1), sort_order: index, status: "draft", content: { meaning: `Meaning ${index + 1}` }, version_number: 2, updated_at: "2026-09-23" }));
const snapshot = {
  exported_at: "2026-09-23T12:00:00Z",
  project: { id: projectId, name: "Full imported deck", description: "Archive test", purpose: "Campaign", intended_reader: "Readers", promise: "Meaning", pathway: "commercial", status: "draft", deck_size: 78, next_action: "Review", current_risk: "Printing" },
  families: [{ id: "family-1", name: "Birds" }], cards,
  guidebook: [{ id: "section-1", title: "Opening", section_type: "front_matter", body_markdown: "Guide text", metadata: { credit: "Artist" }, sort_order: 0, version_number: 1 }],
  journal: [{ id: "entry-1", title: "Prototype", entry_kind: "decision", tags: ["testing"], linked_card_id: "card-0", linked_section_id: null, body_markdown: "Private note" }],
  production_plan: { project_id: projectId, fulfilment_plan: "Post parcels", version_number: 1 },
};
const records = {
  card_versions: cards.map((card) => ({ id: `version-${card.id}`, card_id: card.id, version_number: 1, created_at: "2026-09-22", snapshot: { title: card.title } })),
  guidebook_versions: [{ id: "guide-v1", section_id: "section-1", version_number: 1, created_at: "2026-09-22", snapshot: { body_markdown: "Guide text" } }],
  production_plan_versions: [{ project_id: projectId, version_number: 1, created_at: "2026-09-22", snapshot: { fulfilment_plan: "Post parcels" } }],
  import_records: [{ target_type: "card", target_id: "card-0", source_path: "original/cards/first.md", payload: { credit: "Artist" } }],
  photos: [{ id: "photo-1", journal_entry_id: "entry-1", caption: "Draft artwork" }, { id: "photo-2", journal_entry_id: "entry-1", caption: "Missing" }],
  excerpts: [{ journal_entry_id: "entry-1", title: "Launch", purpose: "kickstarter", excerpt_text: "Public excerpt" }],
};
const archive = buildStudioProjectFolder(snapshot, records, [
  { photo_id: "photo-1", bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]) },
  { photo_id: "photo-2", omission: "Stored photograph unavailable" },
]);
const check = spawnSync("python3", ["-c", `import io,json,sys,zipfile
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
assert z.testzip() is None
files=z.namelist()
manifest=json.loads(z.read('manifest.json'))
cards=json.loads(z.read('data/cards.json'))
assert len(cards)==78
assert len([p for p in files if p.startswith('cards/')])==78
assert len(json.loads(z.read('data/card_versions.json')))==78
assert 'Private note' in z.read('journal/001-prototype.md').decode()
assert 'Public excerpt' in z.read('journal/001-prototype.md').decode()
assert 'Artist' in z.read('data/import_records.json').decode()
assert 'photo-1.jpg' in ' '.join(files)
assert len(manifest['omissions'])==1 and 'photo-2' in manifest['omissions'][0]['resource']
assert len(manifest['files'])==len(files)-1
print('78 cards, versions, provenance, journal, media, omissions and ZIP CRCs verified')`], { input: archive, encoding: "utf8" });
assert.equal(check.status, 0, check.stderr);
assert.match(check.stdout, /78 cards/);
const route = readFileSync(new URL("../src/pages/api/studio/projects/[id]/export/[format].ts", import.meta.url), "utf8");
assert.equal(creatorMayExport("creator-a", "creator-a"), true);
assert.equal(creatorMayExport("creator-a", "creator-b"), false);
assert.equal(creatorMayExport("creator-a", undefined), false);
assert.match(route, /creatorMayExport\(project\.owner_id, locals\.user\?\.id\)/);
assert.match(route, /studioAccessResponse\(/);
console.log(check.stdout.trim(), "Creator-only route guard verified");
