import {ProjectSnapshotError,validateProjectSnapshot,snapshotDigest,frozenSnapshotClient,captureLegacyPhotos,captureExchange,type ExchangeSnapshotProvider,type ProjectSnapshotProvider} from '../../../../../../lib/studio/projectSnapshot';
import {preparedEditorialHistoryProvider} from '../../../../../../lib/studio/editorialExportProvider';
import {inspectProjectArchive} from '../../../../../../lib/studio/projectRestore';
import {buildExchangeArchive} from '../../../../../../lib/studio/visualExchangeArchive';
import {localArtistStore} from '../../../../../../lib/studio/artistDirectory';
import {localEditorialHistoryProvider,readEditorialExport,type EditorialHistoryProvider} from '../../../../../../lib/studio/editorialExportProvider';

import {journalPhotoBucket} from '../../../../../../lib/studio/journalPhotoLifecycle';
import type { APIRoute } from "astro";
import { studioProjectReadAccessResponse } from "../../../../../../lib/studio/access";
import { getStudioJournalEntries, getStudioProductionPlan, getStudioProject, getStudioProjectWorkspace } from "../../../../../../lib/studio/queries";
import { studioMarkdownExport, type StudioExport } from "../../../../../../lib/studio/export";
import { buildStudioProjectFolder, creatorMayExport, type FolderMedia, type FolderRecords } from "../../../../../../lib/studio/projectFolder";
import { STUDIO_JOURNAL_PHOTO_BUCKET } from "../../../../../../lib/studio/journalMedia";
import type { SupabaseClient } from "@supabase/supabase-js";
import {originalRegistry,ORIGINAL_ARTWORK_BUCKET,artworkHash} from '../../../../../../lib/studio/originalArtwork';
export const prerender = false;

async function allProjectRows(supabase: SupabaseClient, table: string, projectId: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    const orderColumn = table === "studio_import_records" ? "imported_at" : "created_at";
    const tieColumn = table === "studio_production_plan_versions" ? "version_number" : "id";
    const { data, error } = await supabase.from(table).select("*").eq("project_id", projectId).order(orderColumn).order(tieColumn).range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 500) return rows;
  }
}

export function createProjectExportHandler(provider?: EditorialHistoryProvider): APIRoute { return async ({ locals, params }) => {
  const access = await studioProjectReadAccessResponse(locals.user, locals.profile, locals.supabase, params.id);
  if (access) return access;
  if (!locals.supabase || !params.id || !["md","json","zip"].includes(params.format ?? "")) return new Response("Not found", { status: 404 });
  const project = await getStudioProject(locals.supabase, params.id);
  if (!project || !creatorMayExport(project.owner_id, locals.user?.id)) return new Response("Not found", { status: 404 });
  const [workspace, journal] = await Promise.all([getStudioProjectWorkspace(locals.supabase, params.id), params.format === "zip" ? allProjectRows(locals.supabase, "studio_journal_entries", params.id) : getStudioJournalEntries(locals.supabase, params.id)]);
  if (!workspace.project) return new Response("Not found", { status: 404 });
  const productionPlan = await getStudioProductionPlan(locals.supabase, params.id);
  const snapshot: StudioExport = { exported_at: new Date().toISOString(), project: workspace.project, families: workspace.families, cards: workspace.cards, guidebook: workspace.guidebook, journal: journal as StudioExport["journal"], production_plan: productionPlan };
  if (params.format === "zip") {
    try{const artists=localArtistStore(locals);if(artists){const owned=artists.exchangeOwner(locals.user!.id,project.id).snapshots;const history=await buildExchangeArchive(owned.map((r:any)=>({...r,enquiries:r.interests.map((v:any)=>({id:v.id,artist_name:v.artist_name,directory_status:v.status,message:v.message,created_at:v.created_at??''}))})),locals.user!.id,project.id,project.settings?.visual_exchange_history_v1);snapshot.project={...snapshot.project,settings:{...snapshot.project.settings,visual_exchange_history_v1:history}};}}catch{return new Response('Private Exchange history could not be verified. No incomplete backup was issued.',{status:409});}

    // A complete backup retains deleted cards as well as their version history.
    snapshot.cards = await allProjectRows(locals.supabase, "studio_cards", params.id) as StudioExport["cards"];
    snapshot.guidebook = await allProjectRows(locals.supabase, "studio_guidebook_sections", params.id) as StudioExport["guidebook"];
    snapshot.guidebook.sort((a, b) => a.sort_order - b.sort_order);
    const tables = ["studio_card_versions", "studio_guidebook_versions", "studio_production_plan_versions", "studio_import_records", "studio_journal_photos", "studio_journal_excerpts"];
    const [card_versions, guidebook_versions, production_plan_versions, import_records, photos, excerpts] = await Promise.all(tables.map((table) => allProjectRows(locals.supabase!, table, params.id!)));
    try {
      const history = await readEditorialExport(provider ?? localEditorialHistoryProvider(locals), {
        ownerId: locals.user!.id, projectId: project.id, priorArchive: project.settings?.editorial_history_v1,
        links: { projectId: project.id, cards: workspace.cards, sections: snapshot.guidebook, cardVersions: card_versions, sectionVersions: guidebook_versions, visualBoard: snapshot.project.settings?.visual_design_v1 }
      });
      if (history) snapshot.project = {...snapshot.project, settings: {...snapshot.project.settings, editorial_history_v1: history}};
    } catch {
      return new Response('Private editorial history could not be verified. No incomplete backup was issued; saved records are unchanged.', {status:409,headers:{'Cache-Control':'private, no-store'}});
    }
    const records = { card_versions, guidebook_versions, production_plan_versions, import_records, photos, excerpts } as unknown as FolderRecords;
    if((locals as any).studioProgrammeProgress!==undefined)records.programme_progress=(locals as any).studioProgrammeProgress;
    const media: FolderMedia = [];
    let mediaBytes = 0;
    const maxMediaBytes = 96 * 1024 * 1024;
    const expectedOriginalBytes=originalRegistry(project.settings).assets.reduce((n,a)=>n+a.bytes+a.previewBytes,0);
    if(expectedOriginalBytes>maxMediaBytes)return new Response('This private backup exceeds the current 96 MiB media limit. No files were omitted or deleted. Keep your existing backups and originals; a larger reviewed export workflow is needed.',{status:413,headers:{'Cache-Control':'private,no-store'}});
    for (const photo of records.photos) {
      if (mediaBytes >= maxMediaBytes) { media.push({ photo_id: photo.id, omission: "Export photograph limit reached (96 MB)" }); continue; }
      // The record and its storage path were obtained under the creator's RLS context.
      const { data, error } = await locals.supabase.storage.from(journalPhotoBucket(project.settings,photo.id)).download(photo.storage_path);
      if (error || !data) { media.push({ photo_id: photo.id, omission: "Stored photograph unavailable or access denied" }); continue; }
      const bytes = new Uint8Array(await data.arrayBuffer());
      if (mediaBytes + bytes.length > maxMediaBytes) { media.push({ photo_id: photo.id, omission: "Export photograph limit reached (96 MB)" }); continue; }
      media.push({ photo_id: photo.id, bytes }); mediaBytes += bytes.length;
    }
    const originals=[];
    for(const asset of originalRegistry(project.settings).assets){const item:{asset_id:string;original?:Uint8Array;preview?:Uint8Array;omission?:string}={asset_id:asset.id};if(asset.projectId!==project.id||asset.ownerId!==project.owner_id){item.omission='Original artwork ownership could not be verified';originals.push(item);continue}for(const [field,path,expected]of [['original',asset.storagePath,asset.sha256],['preview',asset.previewPath,asset.previewSha256]] as const){if(mediaBytes>=maxMediaBytes){item.omission='Private media export limit reached (96 MB)';continue}const {data,error}=await locals.supabase.storage.from(ORIGINAL_ARTWORK_BUCKET).download(path);if(error||!data){item.omission='Stored artwork unavailable or access denied';continue}const buffer=new Uint8Array(await data.arrayBuffer());if(mediaBytes+buffer.length>maxMediaBytes||await artworkHash(buffer)!==expected){item.omission='Artwork exceeded the export limit or failed its checksum check';continue}item[field]=buffer;mediaBytes+=buffer.length}originals.push(item)}
    if(media.some(item=>item.omission)||originals.some(item=>item.omission))return new Response('A complete private backup could not be assembled: one or more media files are unavailable, failed integrity checks or exceed the 96 MiB media limit. Nothing was deleted. No incomplete ZIP was issued.',{status:409,headers:{'Cache-Control':'private,no-store'}});
    let bytes:Uint8Array;try{bytes=buildStudioProjectFolder(snapshot, records, media,originals);}catch{return new Response('A complete backup exceeds the supported JSON/restore budget or could not be assembled. Nothing was omitted or deleted; no incomplete ZIP was issued.',{status:413});}
    if(bytes.length>100*1024*1024)return new Response('This project exceeds the current 100 MiB backup limit. Nothing was omitted or deleted. A larger reviewed export workflow is needed.',{status:413});
    return new Response(bytes as BodyInit, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="studio-project-${params.id}.zip"`, "Cache-Control": "private, no-store" } });
  }
  const {editorial_history_v1:excludedPrivateHistory,visual_exchange_history_v1:excludedExchangeHistory,...authoringSettings}=snapshot.project.settings??{};snapshot.project={...snapshot.project,settings:authoringSettings};
  const body = params.format === "json" ? JSON.stringify({...snapshot,export_scope:'Authoring records only. Use complete ZIP for saved private editorial and Exchange history; account/community data and unsaved browser drafts are excluded.'}, null, 2) : studioMarkdownExport(snapshot)+'\n\nExport scope: authoring manuscript only. Use the complete ZIP for saved private editorial and Exchange history. Account/community data and unsaved browser drafts are excluded.\n';
  return new Response(body, { headers: { "Content-Type": params.format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="studio-project-${params.id}.${params.format}"`, "Cache-Control": "private, no-store" } });
};
}
/** Default ZIP route requires a coherent provider; legacy assembly remains an internal reusable serializer. */
export function createCoherentProjectExportHandler(provider?:ProjectSnapshotProvider):APIRoute{return async context=>{
 if(context.params.format!=='zip')return createProjectExportHandler()(context);
 const fail=(message:string)=>new Response(message,{status:409,headers:{'Content-Type':'text/plain;charset=utf-8','Cache-Control':'private, no-store'}});
 try{
  const {locals,params}=context;const access=await studioProjectReadAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(access)return access;
  if(!locals.user||!locals.supabase||!params.id)return new Response('Not found',{status:404});
  const source=provider??(locals as any).studioProjectSnapshotProvider;if(!source)return fail('Coherent project backup is not connected in this environment. Your saved work is unchanged; no incomplete ZIP was issued.');
  const exchangeProvider=(locals as any).studioExchangeSnapshotProvider as ExchangeSnapshotProvider|undefined;
  if(localArtistStore(locals)&&!exchangeProvider)return fail('Current private Exchange history needs a versioned snapshot before a complete backup can be issued.');
  // Enclose the database capture in the Exchange revision interval: no mixed independent-store eras.
  const exchange=exchangeProvider?await captureExchange(exchangeProvider,locals.user.id,params.id):null;
  const captured=validateProjectSnapshot(await source.capture(locals.user.id,params.id),locals.user.id,params.id),fingerprint=await snapshotDigest(captured);
  const projected=structuredClone(captured);
  if(exchange)projected.tables.studio_projects[0].settings={...projected.tables.studio_projects[0].settings,visual_exchange_history_v1:await buildExchangeArchive(exchange.rows,locals.user.id,params.id,projected.tables.studio_projects[0].settings?.visual_exchange_history_v1)};
  const legacy=await captureLegacyPhotos(projected,locals.supabase);
  const frozen=frozenSnapshotClient(projected,locals.supabase,legacy.hashes);
  const response=await createProjectExportHandler(preparedEditorialHistoryProvider(frozen))({...context,locals:{...locals,supabase:frozen,studioProgrammeProgress:captured.tables.studio_programme_progress,studioSupportLocal:false,studioArtistLocal:false} as any});
  if(response.status!==200)return response;
  const bytes=new Uint8Array(await response.arrayBuffer());await inspectProjectArchive(bytes);
  await legacy.verify();
  const current=validateProjectSnapshot(await source.capture(locals.user.id,params.id),locals.user.id,params.id);
  if(await snapshotDigest(current)!==fingerprint)return fail('Your saved project changed while the backup was being prepared. Finish saving, then try the backup again. No mixed-version ZIP was issued.');
  if(exchange&&JSON.stringify(await captureExchange(exchangeProvider!,locals.user.id,params.id))!==JSON.stringify(exchange))return fail('Private Exchange history changed while the backup was being prepared. Retry after saving. No mixed-version ZIP was issued.');
  const finalAccess=await studioProjectReadAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(finalAccess)return finalAccess;
  return new Response(bytes as BodyInit,{status:200,headers:response.headers});
 }catch(error){return fail(error instanceof ProjectSnapshotError?error.message:'The complete project snapshot or its restore integrity could not be verified. Keep your existing files and retry; no incomplete ZIP was issued.');}
};}
export const GET = createCoherentProjectExportHandler();
