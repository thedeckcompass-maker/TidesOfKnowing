// One local route-to-route journey. Provider state is synthetic, not hosted Auth/RLS acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import sharp from 'sharp';
const source=`export {POST as projectCreate} from './src/pages/api/studio/projects.ts';export {POST as cardCreate} from './src/pages/api/studio/projects/[id]/cards.ts';export {POST as cardSave} from './src/pages/api/studio/cards/[id].ts';export {POST as guideCreate} from './src/pages/api/studio/projects/[id]/guidebook.ts';export {POST as guideSave} from './src/pages/api/studio/guidebook/[id].ts';export {POST as journalCreate} from './src/pages/api/studio/projects/[id]/journal.ts';export {POST as visualSave} from './src/pages/api/studio/projects/[id]/visual-design.ts';export {POST as directionSave} from './src/pages/api/studio/projects/[id]/visual-direction.ts';export {GET as workbook} from './src/pages/api/studio/projects/[id]/project-book.ts';export {getStudioProjectWorkspace,getStudioJournalEntries} from './src/lib/studio/queries.ts';export {SNAPSHOT_TABLES} from './src/lib/studio/projectSnapshot.ts';export {createCoherentProjectExportHandler} from './src/pages/api/studio/projects/[id]/export/[format].ts';export {inspectProjectArchive} from './src/lib/studio/projectRestore.ts';export {visualDefaults,blankVisualCard} from './src/lib/studio/visualDesign.ts';`;
const output=await build({stdin:{contents:source,resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',define:{'import.meta.env':'{}'},logLevel:'silent'}),m={exports:{}};
new Function('module','exports','require',output.outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));const lib=m.exports;
const owner='11111111-1111-4111-8111-111111111111',pid='22222222-2222-4222-8222-222222222222',cid='33333333-3333-4333-8333-333333333333',jid='44444444-4444-4444-8444-444444444444';
test('Stage 9 same-owner journey preserves writing, artwork, Workbook, Journal and ZIP across revisions and expiry',async()=>{
 const tables=Object.fromEntries([...lib.SNAPSHOT_TABLES,'profiles','studio_access'].map(t=>[t,[]]));tables.profiles=[{id:owner,status:'active',role:'member'}];
 let tick=0,writable=true,readable=true,readFailure=false;const stamp=()=>new Date(Date.UTC(2026,10,17,12,0,++tick)).toISOString();
 const db={auth:{async getUser(){return {data:{user:{id:owner}},error:null}}},async rpc(name,args){assert.equal(args.p_project,pid);if(name==='studio_project_can_edit_v1')return {data:writable,error:null};if(name==='studio_project_can_read_v1')return readFailure?{data:null,error:{code:'SYNTHETIC_UNAVAILABLE'}}:{data:readable,error:null};throw Error('Unexpected RPC '+name)},storage:{from(){throw Error('No hosted Storage downloads permitted in this journey')}},from(table){
  assert.ok(table in tables,table);let filters=[],mode='read',value,order=[],start=0,end=Infinity,result;
  const finish=()=>{if(result)return result;let rows=tables[table].filter(r=>filters.every(f=>f(r)));
   if(mode==='insert'){const row={id:crypto.randomUUID(),settings:{},content:{},metadata:{},body_markdown:'',status:table==='studio_projects'?'planning':'draft',version_number:1,deleted_at:null,created_at:stamp(),updated_at:stamp(),...structuredClone(value)};tables[table].push(row);rows=[row];if(table==='studio_cards'||table==='studio_guidebook_sections')tables[table==='studio_cards'?'studio_card_versions':'studio_guidebook_versions'].push({id:crypto.randomUUID(),project_id:row.project_id,[table==='studio_cards'?'card_id':'section_id']:row.id,version_number:1,snapshot:structuredClone(row)});}
   if(mode==='update')for(const row of rows){Object.assign(row,structuredClone(value));row.updated_at=stamp();if(table==='studio_cards'||table==='studio_guidebook_sections'){row.version_number++;tables[table==='studio_cards'?'studio_card_versions':'studio_guidebook_versions'].push({id:crypto.randomUUID(),project_id:row.project_id,[table==='studio_cards'?'card_id':'section_id']:row.id,version_number:row.version_number,snapshot:structuredClone(row)});}}
   rows=[...rows].sort((a,b)=>{for(const key of order)if(a[key]!==b[key])return a[key]>b[key]?1:-1;return 0;});return result={data:structuredClone(rows.slice(start,end)),error:null};};
  const q={select(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},neq(k,v){filters.push(r=>r[k]!==v);return q},is(k,v){filters.push(r=>v===null?r[k]==null:r[k]===v);return q},order(k){order.push(k);return q},range(a,b){start=a;end=b+1;return q},insert(v){mode='insert';value=v;return q},update(v){mode='update';value=v;return q},async maybeSingle(){const r=finish();return {...r,data:r.data[0]??null}},async single(){return q.maybeSingle()},then(a,b){return Promise.resolve().then(finish).then(a,b)}};return q;
 }};
 const locals={user:{id:owner},profile:tables.profiles[0],supabase:db};
 const form=(values)=>{const body=new FormData();for(const[k,v]of Object.entries(values))body.set(k,String(v));return new Request('https://stage9.invalid/api',{method:'POST',headers:{origin:'https://stage9.invalid',accept:'application/json'},body})};
 const json=(value)=>new Request('https://stage9.invalid/api',{method:'POST',headers:{origin:'https://stage9.invalid','content-type':'application/json'},body:JSON.stringify(value)});
 const invoke=async(fn,request,params={},status=200)=>{const r=await fn({request,locals,params});assert.equal(r.status,status,await r.clone().text());return r};
 let r=await invoke(lib.projectCreate,form({request_id:pid,name:'Stage 9 synthetic deck',deck_type:'oracle',pathway:'personal',task:'walkthrough'}));assert.equal((await r.json()).location,`/studio/projects/${pid}/?view=walkthrough`);
 r=await invoke(lib.cardCreate,form({creation_id:cid,title:'A turning point',card_number:'1'}),{id:pid});assert.match((await r.json()).location,new RegExp(cid));
 const cardFields={project_id:pid,title:'A turning point',card_number:'1',sort_order:0,status:'draft',family_id:'',meaning:'A first interpretation.'};
 await invoke(lib.cardSave,form({...cardFields,expected_current_version:1}),{id:cid});
 await invoke(lib.cardSave,form({...cardFields,meaning:'A revised interpretation.',expected_current_version:2}),{id:cid});
 await invoke(lib.cardSave,form({...cardFields,meaning:'Stale writing must not win.',expected_current_version:1}),{id:cid},409);
 r=await invoke(lib.guideCreate,form({title:'Using this deck',section_type:'instructions',sort_order:0}),{id:pid},303);const gid=r.headers.get('location').match(/guidebook\/([^/]+)\//)[1];
 await invoke(lib.guideSave,form({project_id:pid,expected_current_version:1,title:'Using this deck',section_type:'instructions',sort_order:0,status:'draft',body_markdown:'Pause, choose a card and reflect.'}),{id:gid});
 await invoke(lib.journalCreate,form({capture_id:jid,entry_kind:'reflection',title:'Creative observation',body_markdown:'The turning point suggests an open doorway.',linked_card_id:cid}),{id:pid});
 const bytes=await sharp({create:{width:120,height:180,channels:3,background:'#204050'}}).jpeg().toBuffer(),front='data:image/jpeg;base64,'+bytes.toString('base64');
 const board={defaults:{...lib.visualDefaults,elements:'artwork'},cards:{[cid]:{...lib.blankVisualCard(),front,url:'https://example.invalid/meaning',qrPlacement:'both'}},references:[],commonBack:'',notes:'Synthetic color study',locked:[]};
 await invoke(lib.visualSave,json({scope:'deck',defaults:{...board.defaults,sizePreset:'tarot'},locked:[],notes:board.notes,expectedUpdatedAt:tables.studio_projects[0].updated_at}),{id:pid});
 await invoke(lib.visualSave,json({scope:'card',cardId:cid,card:board.cards[cid],expectedUpdatedAt:tables.studio_projects[0].updated_at}),{id:pid});
 await invoke(lib.directionSave,json({expectedUpdatedAt:tables.studio_projects[0].updated_at,expectedRevision:0,fields:{vision:'Quiet blue visual world'},links:[{journalId:jid,cardIds:[cid],motifs:'Doorway',why:'A moment of change'}]}),{id:pid});
 const workspace=await lib.getStudioProjectWorkspace(db,pid),journals=await lib.getStudioJournalEntries(db,pid);
 assert.equal(workspace.cards[0].content.meaning,'A revised interpretation.');assert.equal(workspace.cards[0].version_number,3);assert.equal(journals[0].linked_card_id,cid);assert.equal(workspace.guidebook[0].body_markdown,'Pause, choose a card and reflect.');
 // Another valid project entitlement must beat an unrelated expired paid projection.
 tables.studio_access=[{user_id:owner,starts_at:'2020-01-01',expires_at:'2020-02-01',revoked_at:null}];
 r=await lib.workbook({locals,params:{id:pid}});assert.equal(r.status,200,'Eligible Explore/scoped project Workbook must use project read authority, not the expired paid projection');
 assert.match(await r.text(),/A revised interpretation/);
 readable=false;r=await lib.workbook({locals,params:{id:pid}});assert.equal(r.status,403,'Workbook must refuse an explicit project read denial');readable=true;
 readFailure=true;r=await lib.workbook({locals,params:{id:pid}});assert.equal(r.status,503,'Unavailable project authority must fail closed');readFailure=false;
 const foreign='55555555-5555-4555-8555-555555555555';r=await lib.workbook({locals:{...locals,user:{id:foreign},profile:{id:foreign,status:'active',role:'member'}},params:{id:pid}});assert.equal(r.status,404,'Ownership query must still refuse a foreign account even with a positive injected permission response');
 writable=false;await invoke(lib.cardSave,form({...cardFields,expected_current_version:3}),{id:cid},403);assert.equal(tables.studio_cards[0].version_number,3);
 const snapshot=()=>({version:1,ownerId:owner,projectId:pid,coverage:'project-and-editorial-v1',tables:structuredClone(Object.fromEntries(lib.SNAPSHOT_TABLES.map(t=>[t,tables[t]]))),editorial:{version:1,consistent_snapshot:true,requests:[],replies:[]}});
 const exportRoute=lib.createCoherentProjectExportHandler({async capture(actor,id){assert.equal(actor,owner);assert.equal(id,pid);return snapshot()}});
 r=await exportRoute({locals,params:{id:pid,format:'zip'}});assert.equal(r.status,200,await r.clone().text());const archive=await lib.inspectProjectArchive(new Uint8Array(await r.arrayBuffer()));
 assert.equal(archive.data.cards[0].content.meaning,'A revised interpretation.');assert.equal(archive.data.journal[0].linked_card_id,cid);assert.equal(archive.counts.card_versions,3);assert.equal(archive.data.guidebook[0].body_markdown,'Pause, choose a card and reflect.');assert.deepEqual(Buffer.from(archive.files.get(`visual-design/cards/${cid}/front.jpg`)),bytes);
 const before=JSON.stringify(tables);readable=false;r=await lib.workbook({locals,params:{id:pid}});assert.equal(r.status,403);r=await exportRoute({locals,params:{id:pid,format:'zip'}});assert.equal(r.status,403);assert.equal(JSON.stringify(tables),before);
});
