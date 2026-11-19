import {validateProgrammeProgress} from './programmeArchive';
import type {SupabaseClient} from '@supabase/supabase-js';
import {artworkHash,inspectOriginalImage,originalRegistry,ORIGINAL_ARTWORK_BUCKET} from './originalArtwork';
import {journalPhotoBucket} from './journalPhotoLifecycle';

export class ProjectSnapshotError extends Error {}
export const SNAPSHOT_TABLES=['studio_projects','studio_card_families','studio_cards','studio_guidebook_sections','studio_journal_entries','studio_production_plans','studio_card_versions','studio_guidebook_versions','studio_production_plan_versions','studio_import_records','studio_journal_photos','studio_journal_excerpts','studio_programme_progress'] as const;
export type ProjectSnapshot={version:1;ownerId:string;projectId:string;coverage:'project-and-editorial-v1';tables:Record<string,any[]>;editorial:{version:1;consistent_snapshot:true;requests:any[];replies:any[]}};
/** Server-only boundary: capture must read one database statement/transaction, never paginated live reads. */
export type ProjectSnapshotProvider={capture:(ownerId:string,projectId:string)=>Promise<ProjectSnapshot>};
/** Trusted server store: revision must increase on EVERY write/deletion, including enquiries.
 * Rows and revision must be captured atomically. Never accept this contract from request data. */
export type ExchangeSnapshotProvider={capture:(ownerId:string,projectId:string)=>Promise<{ownerId:string;projectId:string;revision:number;rows:any[]}>};
export async function captureExchange(provider:ExchangeSnapshotProvider,ownerId:string,projectId:string){
 const value=structuredClone(await provider.capture(ownerId,projectId));
 if(value.ownerId!==ownerId||value.projectId!==projectId||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.rows))throw new ProjectSnapshotError('Private Exchange snapshot identity or revision is invalid.');
 return value;
}
/** Legacy files have no historical checksum: verify export-time stability without backfilling.
 * This does not establish original provenance or a transaction across external storage. */
export async function captureLegacyPhotos(snapshot:ProjectSnapshot,live:SupabaseClient){
 const hashes=new Map<string,string>(),paths:{bucket:string;path:string;key:string}[]=[],settings=snapshot.tables.studio_projects[0].settings;
 let total=0;
 for(const photo of snapshot.tables.studio_journal_photos){
  if(originalRegistry(settings).assets.some(a=>a.slot==='journalPhoto'&&a.journalPhotoId===photo.id))continue;
  if(typeof photo.storage_path!=='string'||!photo.storage_path||photo.storage_path.includes('..'))throw new ProjectSnapshotError('A legacy photograph reference is invalid.');
  const bucket=journalPhotoBucket(settings,photo.id),path=photo.storage_path,key=bucket+':'+path;if(hashes.has(key))continue;
  const {data,error}=await live.storage.from(bucket).download(path);
  if(error||!data)throw new ProjectSnapshotError('A legacy photograph is unavailable. No incomplete ZIP was issued.');
  if(data.size>6*1024*1024||(total+=data.size)>96*1024*1024)throw new ProjectSnapshotError('Legacy photographs exceed the current backup media limit.');
  const bytes=new Uint8Array(await data.arrayBuffer());inspectOriginalImage(bytes,'image/jpeg');
  hashes.set(key,await artworkHash(bytes));paths.push({bucket,path,key});
 }
 return {hashes,async verify(){for(const {bucket,path,key}of paths){const {data,error}=await live.storage.from(bucket).download(path);if(error||!data||data.size>96*1024*1024||await artworkHash(new Uint8Array(await data.arrayBuffer()))!==hashes.get(key))throw new ProjectSnapshotError('A legacy photograph changed or became unavailable during backup. Retry after saving.');}}};
}
const canonical=(value:any):string=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])):item);
export function validateProjectSnapshot(value:ProjectSnapshot,ownerId:string,projectId:string){
 if(!value||value.version!==1||value.coverage!=='project-and-editorial-v1'||value.ownerId!==ownerId||value.projectId!==projectId||!value.tables)throw new ProjectSnapshotError('The complete project snapshot could not be verified.');
 if(new TextEncoder().encode(JSON.stringify(value)).length>64*1024*1024)throw new ProjectSnapshotError('The saved project exceeds the current snapshot limit.');
 for(const table of SNAPSHOT_TABLES){const rows=value.tables[table];if(!Array.isArray(rows))throw new ProjectSnapshotError('A required project collection was not returned.');const ids=new Set<string>();for(const row of rows){if(!row||typeof row!=='object'||(table==='studio_projects'?row.id!==projectId||row.owner_id!==ownerId:row.project_id!==projectId))throw new ProjectSnapshotError('A snapshot record belongs to another project.');const key=String(table==='studio_programme_progress'?row.week_number:row.id??row.version_number??'');if(!key||ids.has(key))throw new ProjectSnapshotError('A snapshot collection contains duplicate or missing identities.');ids.add(key);}}
 validateProgrammeProgress(value.tables.studio_programme_progress,projectId);
 if(value.tables.studio_projects.length!==1)throw new ProjectSnapshotError('The owned project is no longer available.');
 if(!value.editorial||value.editorial.version!==1||value.editorial.consistent_snapshot!==true||!Array.isArray(value.editorial.requests)||!Array.isArray(value.editorial.replies))throw new ProjectSnapshotError('Private history is missing from the complete snapshot.');
 return structuredClone(value);
}
export async function snapshotDigest(value:ProjectSnapshot){const stable=structuredClone(value);for(const table of SNAPSHOT_TABLES)stable.tables[table].sort((a,b)=>canonical(a).localeCompare(canonical(b)));stable.editorial.requests.sort((a,b)=>String(a.id).localeCompare(String(b.id)));stable.editorial.replies.sort((a,b)=>String(a.id).localeCompare(String(b.id)));return artworkHash(new TextEncoder().encode(canonical(stable)));}
/** Explicitly composed after approval; no automatic RPC/credential fallback. */
export function preparedProjectSnapshotProvider(client:SupabaseClient):ProjectSnapshotProvider{return {async capture(ownerId,projectId){const user=await client.auth.getUser();if(user.error||user.data.user?.id!==ownerId)throw new ProjectSnapshotError('Sign in again before exporting.');const result=await client.rpc('studio_project_export_snapshot_v1',{p_project:projectId});if(result.error)throw new ProjectSnapshotError('Coherent project backup is not connected. No incomplete ZIP was issued.');return validateProjectSnapshot(result.data as ProjectSnapshot,ownerId,projectId);}};}
/** Read-only projection: project queries cannot fall through to the changing database. */
export function frozenSnapshotClient(snapshot:ProjectSnapshot,live:SupabaseClient,legacyHashes:Map<string,string>=new Map()):SupabaseClient{
 const state=structuredClone(snapshot),project=state.tables.studio_projects[0],expected=new Map<string,string>();
 const add=(bucket:string,path:string,sha:string)=>{if(!/^[a-f0-9]{64}$/i.test(sha??''))throw new ProjectSnapshotError('A stored photograph has no verified checksum. Its integrity must be checked before complete backup.');const key=bucket+':'+path;if(expected.has(key)&&expected.get(key)!==sha)throw new ProjectSnapshotError('Stored media references disagree.');expected.set(key,sha);};
 for(const asset of originalRegistry(project.settings).assets){if(asset.ownerId!==snapshot.ownerId||asset.projectId!==snapshot.projectId)throw new ProjectSnapshotError('Artwork ownership does not match the project.');add(ORIGINAL_ARTWORK_BUCKET,asset.storagePath,asset.sha256);add(ORIGINAL_ARTWORK_BUCKET,asset.previewPath,asset.previewSha256);}
 for(const photo of state.tables.studio_journal_photos){const bucket=journalPhotoBucket(project.settings,photo.id),key=bucket+':'+photo.storage_path;if(!expected.has(key)){const hash=legacyHashes.get(key);if(!hash)throw new ProjectSnapshotError('A stored photograph could not be verified for this backup.');add(bucket,photo.storage_path,hash);}}
 return {auth:live.auth,from(table:string){if(['studio_access','profiles'].includes(table))return live.from(table);if(!SNAPSHOT_TABLES.includes(table as any))throw new ProjectSnapshotError('This collection is outside the captured backup.');let filters:((row:any)=>boolean)[]=[],orders:{key:string;ascending:boolean}[]=[],start=0,end=Infinity;const read=()=>{let rows=state.tables[table].filter(r=>filters.every(f=>f(r)));rows=[...rows].sort((a,b)=>{for(const o of orders){if(a[o.key]!==b[o.key])return (a[o.key]>b[o.key]?1:-1)*(o.ascending?1:-1);}return 0;});return {data:structuredClone(rows.slice(start,end)),error:null};};const q:any={select(){return q},eq(k:string,v:any){filters.push(r=>r[k]===v);return q},neq(k:string,v:any){filters.push(r=>r[k]!==v);return q},is(k:string,v:any){filters.push(r=>v===null?r[k]==null:r[k]===v);return q},in(k:string,v:any[]){filters.push(r=>v.includes(r[k]));return q},order(key:string,options:any={}){orders.push({key,ascending:options.ascending!==false});return q},range(a:number,b:number){start=a;end=b+1;return q},limit(n:number){end=start+n;return q},async maybeSingle(){const r=read();return {...r,data:r.data[0]??null}},async single(){return q.maybeSingle()},then(resolve:any,reject:any){return Promise.resolve().then(read).then(resolve,reject)}};return q;},rpc:async(name:string,args?:Record<string,unknown>)=>{if(name==='studio_project_can_read_v1')return live.rpc(name,args);if(name!=='studio_editorial_owner_history_v1')throw new ProjectSnapshotError('Uncaptured history request.');return {data:structuredClone(state.editorial),error:null};},storage:{from(bucket:string){return {async download(path:string){const sha=expected.get(bucket+':'+path);if(!sha)throw new ProjectSnapshotError('Uncaptured media reference.');const result=await live.storage.from(bucket).download(path);if(result.error||!result.data)throw new ProjectSnapshotError('A captured media file is unavailable. Keep your files and retry the backup.');const bytes=new Uint8Array(await result.data.arrayBuffer());if(await artworkHash(bytes)!==sha)throw new ProjectSnapshotError('A media file changed or failed its checksum. No ZIP was issued.');return {data:new Blob([bytes as BlobPart]),error:null};}};}}} as unknown as SupabaseClient;
}
