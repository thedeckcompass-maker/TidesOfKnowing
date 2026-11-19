import {PROGRAMME_ARCHIVE_EXTENSION,validateProgrammeProgress,programmeProgressMarkdown} from './programmeArchive';
import {exchangeArchiveMarkdown,type ExchangeArchive} from './visualExchangeArchive';
import {editorialArchiveMarkdown,type EditorialArchive} from './editorialArchive';
import {visualBookMarkdown} from './symbolJournal';
import { readingManuscript } from './readingText.ts';
import {visualFiles} from './visualExport';
import type { StudioExport } from "./export";
import { studioMarkdownExport } from "./export.ts";
import { readableFields, fieldsMarkdown } from "./readableFields.ts";
import type { StudioJournalExcerpt, StudioJournalPhoto } from "./types";
import {originalRegistry,originalExtension} from './originalArtwork';

export type FolderRecords = {
  programme_progress?: Record<string,unknown>[];
  card_versions: Record<string, unknown>[];
  guidebook_versions: Record<string, unknown>[];
  production_plan_versions: Record<string, unknown>[];
  import_records: Record<string, unknown>[];
  photos: StudioJournalPhoto[];
  excerpts: StudioJournalExcerpt[];
};
export type FolderMedia = { photo_id: string; bytes?: Uint8Array; omission?: string }[];
export type OriginalFolderMedia = {asset_id:string;original?:Uint8Array;preview?:Uint8Array;omission?:string}[];
export function creatorMayExport(ownerId: string, userId: string | undefined): boolean {
  return Boolean(userId && ownerId === userId);
}

const encoder = new TextEncoder();
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const slug = (value: string) => value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55).toLowerCase() || "untitled";
const named = (index: number, title: string) => `${String(index + 1).padStart(3, "0")}-${slug(title)}`;

// ZIP store entries: avoids a compression dependency in the Workers runtime.
export function zipStored(files: { path: string; bytes: Uint8Array }[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u16 = (view: DataView, at: number, value: number) => view.setUint16(at, value, true);
  const u32 = (view: DataView, at: number, value: number) => view.setUint32(at, value >>> 0, true);
  const crc32 = (bytes: Uint8Array) => {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  };
  for (const { path, bytes } of files) {
    const name = encoder.encode(path);
    if (name.length > 65535 || bytes.length > 0xffffffff) throw new Error("Export file too large");
    const crc = crc32(bytes);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0x800); u32(lv, 14, crc);
    u32(lv, 18, bytes.length); u32(lv, 22, bytes.length); u16(lv, 26, name.length);
    local.set(name, 30);
    chunks.push(local, bytes);
    const entry = new Uint8Array(46 + name.length);
    const cv = new DataView(entry.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x800);
    u32(cv, 16, crc); u32(cv, 20, bytes.length); u32(cv, 24, bytes.length);
    u16(cv, 28, name.length); u32(cv, 42, offset); entry.set(name, 46);
    central.push(entry);
    offset += local.length + bytes.length;
  }
  const centralSize = central.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 8, files.length); u16(ev, 10, files.length);
  u32(ev, 12, centralSize); u32(ev, 16, offset);
  if (files.length > 65535 || offset + centralSize > 0xffffffff) throw new Error("Export archive too large");
  const output = new Uint8Array(offset + centralSize + end.length);
  let at = 0;
  for (const chunk of [...chunks, ...central, end]) { output.set(chunk, at); at += chunk.length; }
  return output;
}

export function buildStudioProjectFolder(snapshot: StudioExport, records: FolderRecords, media: FolderMedia, originals:OriginalFolderMedia=[]): Uint8Array {
  const files: { path: string; bytes: Uint8Array }[] = [];
  const add = (path: string, value: string | Uint8Array) => files.push({ path, bytes: typeof value === "string" ? encoder.encode(value) : value });
  const programme=records.programme_progress===undefined?undefined:validateProgrammeProgress(records.programme_progress,snapshot.project.id);
  if(programme)add('private-programme-progress.md',programmeProgressMarkdown(programme));
  const cardNames = new Map(snapshot.cards.map((card) => [card.id, card.title]));
  const sectionNames = new Map(snapshot.guidebook.map((section) => [section.id, section.title]));
  const familyNames = new Map(snapshot.families.map((family) => [family.id, family.name]));
  const journalNames = new Map(snapshot.journal.map((entry) => [entry.id, entry.title]));
  const exchange=snapshot.project.settings?.visual_exchange_history_v1 as ExchangeArchive|undefined;if(exchange)add('private-visual-exchange-history.md',exchangeArchiveMarkdown(exchange));
  const editorial=snapshot.project.settings?.editorial_history_v1 as EditorialArchive|undefined;if(editorial)add('private-editorial-history.md',editorialArchiveMarkdown(editorial));
  const visualDirection:any=snapshot.project.settings?.visual_direction_v1;
  if(visualDirection){const selectedPhotos=visualDirection.sources.filter((source:any)=>source.kind==='photo').map((source:any)=>{const photo=records.photos.find(p=>p.id===source.photoId),item=media.find(m=>m.photo_id===source.photoId);return photo&&item?.bytes?'!['+String(source.text||'Selected private photograph').replace(/[\[\]]/g,'')+'](../media/journal/'+slug(journalNames.get(photo.journal_entry_id)??'entry')+'-'+photo.id+'.jpg)':''}).filter(Boolean).join('\n\n');add('visual-design/visual-design-book.md',visualBookMarkdown(visualDirection)+(selectedPhotos?'\n\n## Selected private photographs\n\n'+selectedPhotos:''));}

  add("README.md", `# ${snapshot.project.name}\n\nExported ${snapshot.exported_at}. This folder contains private project writing and photographs. Keep it in a safe place.\n\nScope: saved project authoring records and media. ${editorial?'Saved owner-only editorial snapshots/replies are included as private archived evidence in data/project.json and private-editorial-history.md; imports never reopen requests or grant staff access.':'This export has no connected editorial-history inclusion; it is not a backup of an account-level support inbox.'} Programme enrolment and schedule unlocks are not restored. Programme notes/progress are included when the programme-progress-v1 extension is listed in manifest.json. Community conversations/topic priorities, other creators, staff-only notes, artist/account records and unsaved browser drafts are excluded. ${exchange?'Own saved Exchange drafts, immutable shared/withdrawn snapshots and creator-visible enquiries are included privately; restoration never republishes or recreates enquiries.':'No connected Exchange-history inclusion is available.'} Other creators, artist-private contacts and moderation notes are excluded.\n\nStart with project.md, then open cards/, guidebook/, journal/, and production.md. data/ contains the complete structured records and version snapshots. manifest.json lists every included file and any unavailable photograph. Retained card-art and journal-photo originals, with their working derivatives, are described in original-artwork-readme.md when present. Older preview-only uploads have no recoverable source original; inspect the manifest and retained-original records.\n`);
  add("project.md", `# ${snapshot.project.name}\n\n${snapshot.project.description}\n\n- Purpose: ${snapshot.project.purpose}\n- Intended reader: ${snapshot.project.intended_reader}\n- Promise: ${snapshot.project.promise}\n- Pathway: ${snapshot.project.pathway}\n- Status: ${snapshot.project.status}\n- Planned cards: ${snapshot.project.deck_size ?? "Unspecified"}\n- Next action: ${snapshot.project.next_action}\n- Current risk: ${snapshot.project.current_risk}\n`);
  add("complete-manuscript.md", studioMarkdownExport(snapshot));
  const references = { families: Object.fromEntries(familyNames), cards: Object.fromEntries(cardNames) };
  snapshot.cards.forEach((card, i) => add(`cards/${named(i, card.title)}.md`, `# ${card.card_number ? `${card.card_number} · ` : ""}${card.title}\n\nFamily: ${familyNames.get(card.family_id ?? "") ?? "None"}\nStatus: ${card.status}\nCurrent version: ${card.version_number}\n\n${fieldsMarkdown(readableFields(card as unknown as Record<string, unknown>, "card", references).filter(field => !["title", "card_number", "family_id", "sort_order", "status"].includes(field.key)))}\n`));
  snapshot.guidebook.forEach((section, i) => add(`guidebook/${named(i, section.title)}.md`, `# ${section.title}\n\nType: ${section.section_type.replaceAll("_", " ")}\nRelated card: ${cardNames.get(section.card_id ?? "") ?? "None"}\nCurrent version: ${section.version_number}\n\n${readingManuscript(section)}\n\n${fieldsMarkdown(readableFields({ metadata: section.metadata }, "guidebook"))}\n`));
  snapshot.journal.forEach((entry, i) => {
    const excerpts = records.excerpts.filter((excerpt) => excerpt.journal_entry_id === entry.id);
    const photos = records.photos.filter((photo) => photo.journal_entry_id === entry.id);
    add(`journal/${named(i, entry.title)}.md`, `# ${entry.title}\n\nKind: ${entry.entry_kind}\nTags: ${entry.tags.join(", ")}\nRelated card: ${cardNames.get(entry.linked_card_id ?? "") ?? "None"}\nRelated guidebook section: ${sectionNames.get(entry.linked_section_id ?? "") ?? "None"}\n\n${entry.body_markdown}\n\n## Excerpts\n\n${excerpts.map((excerpt) => `### ${excerpt.title} (${excerpt.purpose})\n\n${excerpt.excerpt_text}`).join("\n\n") || "None"}\n\n## Photographs\n\n${photos.map((photo, index) => `- ${photo.caption || `Photograph ${index + 1}`}`).join("\n") || "None"}\n`);
  });
  add("production.md", snapshot.production_plan ? `# Production and publication plan\n\n${fieldsMarkdown(readableFields(snapshot.production_plan, "production"))}\n` : "# Production and publication plan\n\nNo plan recorded yet.\n");
  const histories = [
    ["card", records.card_versions, cardNames, "card_id"],
    ["guidebook", records.guidebook_versions, sectionNames, "section_id"],
    ["production plan", records.production_plan_versions, new Map([[snapshot.project.id, snapshot.project.name]]), "project_id"],
  ] as const;
  for (const [label, versions, names, key] of histories) {
    const lines = [`# ${label} version history`, ""];
    for (const version of versions) {
      const name = names.get(String(version[key])) ?? "Unknown item";
      const restored = version.restored_from_version_id ? `; restored from ${versions.find((candidate) => candidate.id === version.restored_from_version_id)?.version_number ?? "an earlier"} version` : "";
      const kind = label === "card" ? "card" : label === "guidebook" ? "guidebook" : "production";
      const fields = readableFields((version.snapshot ?? {}) as Record<string, unknown>, kind, references);
      lines.push(`## ${name}, version ${version.version_number} (${version.created_at}${restored})`, "", fieldsMarkdown(fields, "###"), "");
    }
    add(`history/${label.replaceAll(" ", "-")}.md`, `${lines.join("\n")}\n`);
  }
  for (const [path, value] of Object.entries({ project: snapshot.project, families: snapshot.families, cards: snapshot.cards, guidebook: snapshot.guidebook, journal: snapshot.journal, production_plan: snapshot.production_plan, ...records })) add(`data/${path}.json`, json(value));
  const omissions: { resource: string; reason: string }[] = [];
  for (const photo of records.photos) {
    const item = media.find((candidate) => candidate.photo_id === photo.id);
    const path = `media/journal/${slug(journalNames.get(photo.journal_entry_id) ?? "entry")}-${photo.id}.jpg`;
    if (item?.bytes) add(path, item.bytes);
    else omissions.push({ resource: `Photograph ${photo.id} (${journalNames.get(photo.journal_entry_id) ?? "journal entry"})`, reason: item?.omission ?? "Stored photograph unavailable" });
  }
  files.push(...visualFiles(snapshot.project,snapshot.cards));
  const localReferences=snapshot.project.settings?.local_artwork_v1 as {cards?:Record<string,{name:string}>}|undefined;
  const localImages=Object.values(localReferences?.cards??{});
  for(const image of localImages)omissions.push({resource:'Creator-kept original: '+image.name,reason:'Original remains in the creator’s folder. Preview, reference and position are included; select the matching original again for full-quality artwork.'});
  const registry=originalRegistry(snapshot.project.settings);
  for(const asset of registry.assets){const item=originals.find(v=>v.asset_id===asset.id);if(item?.original)add(`media/originals/${asset.id}.${originalExtension(asset.mime)}`,item.original);else omissions.push({resource:`Original artwork: ${asset.sourceName}`,reason:item?.omission??'Retained original was unavailable'});if(item?.preview)add(`media/derivatives/${asset.id}.jpg`,item.preview);else omissions.push({resource:`Working preview: ${asset.sourceName}`,reason:item?.omission??'Retained derivative was unavailable'})}
  if(registry.assets.length)add('original-artwork-readme.md','# Retained original artwork\n\nmedia/originals/ contains unmodified source files where available. These may contain private camera/location metadata. Keep this complete folder private. media/derivatives/ contains the related working JPEGs. File identities, source pixel dimensions, hashes and replacement relationships are in data/project.json. Old originals are retained, not replaced. Check manifest.json for unavailable files; a preview is not a substitute for an omitted original. No print readiness is certified.\n');
  add("manifest.json", json({ ...(programme?{extensions:[PROGRAMME_ARCHIVE_EXTENSION]}:{}), format: localImages.length?'studio-project-folder-v5':exchange?.records.length?'studio-project-folder-v4':editorial?.records.length?'studio-project-folder-v3':registry.assets.length?'studio-project-folder-v2':"studio-project-folder-v1", exported_at: snapshot.exported_at, project: { id: snapshot.project.id, name: snapshot.project.name }, files: files.map(({ path, bytes }) => ({ path, bytes: bytes.length })), omissions }));
  let jsonBytes=0;for(const f of files)if(f.path.endsWith('.json')){jsonBytes+=f.bytes.length;if(f.bytes.length>8*1024*1024||jsonBytes>24*1024*1024)throw Error('Backup JSON exceeds the supported restore limits (8 MiB per file; 24 MiB total). No incomplete backup was issued.');}
  return zipStored(files);
}

