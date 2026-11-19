import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';

async function modules(){const result=await build({stdin:{contents:`export {buildStudioProjectFolder} from './src/lib/studio/projectFolder.ts'; export {inspectProjectArchive,readStoredProjectZip} from './src/lib/studio/projectRestore.ts'; export {SNAPSHOT_TABLES} from './src/lib/studio/projectSnapshot.ts'; export {createCoherentProjectExportHandler} from './src/pages/api/studio/projects/[id]/export/[format].ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'}});const m={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));return m.exports;}
test('actual ZIP assembly and inspection preserve active and deleted cards, versions, guidebook and workbook',async()=>{
 const {buildStudioProjectFolder,inspectProjectArchive,readStoredProjectZip,SNAPSHOT_TABLES,createCoherentProjectExportHandler}=await modules();
 const owner='11111111-1111-4111-8111-111111111111',pid='22222222-2222-4222-8222-222222222222',c1='33333333-3333-4333-8333-333333333333',c2='44444444-4444-4444-8444-444444444444',section='55555555-5555-4555-8555-555555555555';
 const project={id:pid,owner_id:owner,name:'Synthetic deck',deck_type:'oracle',pathway:'personal',status:'writing',settings:{syntheticWorkbook:'Preserved workbook'},description:'',purpose:'',intended_reader:'',promise:'',deck_size:null,next_action:'',current_risk:''};
 const cards=[{id:c1,project_id:pid,title:'Active card',card_number:'',sort_order:0,status:'draft',family_id:null,content:{meaning:'First meaning'},version_number:1,deleted_at:null},{id:c2,project_id:pid,title:'Deleted card',card_number:'',sort_order:1,status:'review',family_id:null,content:{meaning:'Retained meaning'},version_number:1,deleted_at:'2026-01-01T00:00:00Z'}];
 const guidebook=[{id:section,project_id:pid,section_type:'chapter',title:'Guidebook chapter',sort_order:0,status:'draft',body_markdown:'Preserved guidebook',metadata:{},version_number:1,card_id:null}];
 const versions=[{id:'66666666-6666-4666-8666-666666666666',project_id:pid,card_id:c1,version_number:1,snapshot:{content:cards[0].content}},{id:'77777777-7777-4777-8777-777777777777',project_id:pid,card_id:c2,version_number:1,snapshot:{content:cards[1].content}}];
 const records={card_versions:versions,guidebook_versions:[{id:'88888888-8888-4888-8888-888888888888',project_id:pid,section_id:section,version_number:1,snapshot:{body_markdown:'Preserved guidebook'}}],production_plan_versions:[],import_records:[],photos:[],excerpts:[]};
 const bytes=buildStudioProjectFolder({exported_at:'2026-01-01T00:00:00Z',project,families:[],cards,guidebook,journal:[],production_plan:null},records,[]);
 const archive=await inspectProjectArchive(bytes);assert.equal(archive.counts.cards,2);assert.equal(archive.counts.card_versions,2);assert.equal(archive.counts.guidebook,1);
 assert.equal(archive.project.settings.syntheticWorkbook,'Preserved workbook');assert.equal(archive.data.cards.find(c=>c.id===c2).content.meaning,'Retained meaning');assert.ok(archive.data.cards.find(c=>c.id===c2).deleted_at);
 assert.equal(archive.data.guidebook[0].body_markdown,'Preserved guidebook');assert.equal(archive.omissions.length,0);
 const files=readStoredProjectZip(bytes);assert.ok(files.has('data/card_versions.json'));assert.ok(files.has('data/project.json'));
 const broken=bytes.slice();broken[40]^=1;await assert.rejects(inspectProjectArchive(broken));
 // Exercise the real route, including its frozen reader and its two snapshot reads.
 const tables=Object.fromEntries(SNAPSHOT_TABLES.map(t=>[t,[]]));
 tables.studio_projects=[project];tables.studio_cards=cards;tables.studio_guidebook_sections=guidebook;tables.studio_card_versions=versions;tables.studio_guidebook_versions=records.guidebook_versions;
 const snapshot={version:1,ownerId:owner,projectId:pid,coverage:'project-and-editorial-v1',tables,editorial:{version:1,consistent_snapshot:true,requests:[],replies:[]}};let captures=0;
 const provider={async capture(actor,id){assert.equal(actor,owner);assert.equal(id,pid);captures++;return structuredClone(snapshot)}};
 const supabase={auth:{async getUser(){return {data:{user:{id:owner}},error:null}}},async rpc(name,args){assert.equal(name,'studio_project_can_read_v1');assert.equal(args.p_project,pid);return {data:true,error:null}},from(table){assert.equal(table,'profiles');const q={select(){return q},eq(){return q},async maybeSingle(){return {data:{id:owner,status:'active'},error:null}}};return q},storage:{from(){throw Error('Unexpected synthetic storage access')}}};
 const response=await createCoherentProjectExportHandler(provider)({params:{id:pid,format:'zip'},locals:{user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase,studioSupportLocal:false,studioArtistLocal:false}});
 assert.equal(response.status,200,await response.clone().text());assert.equal(captures,2);
 const routed=await inspectProjectArchive(new Uint8Array(await response.arrayBuffer()));assert.equal(routed.counts.cards,2);assert.equal(routed.data.cards.find(c=>c.id===c2).content.meaning,'Retained meaning');assert.equal(routed.data.guidebook[0].body_markdown,'Preserved guidebook');
 let sequence=0;const changing={async capture(){const value=structuredClone(snapshot);if(++sequence===2)value.tables.studio_projects[0].settings.syntheticWorkbook='Changed during export';return value;}};
 const conflict=await createCoherentProjectExportHandler(changing)({params:{id:pid,format:'zip'},locals:{user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase,studioSupportLocal:false,studioArtistLocal:false}});
 assert.equal(conflict.status,409);assert.match(await conflict.text(),/changed while the backup was being prepared/);
 const foreign=await createCoherentProjectExportHandler(provider)({params:{id:pid,format:'zip'},locals:{user:{id:c1},profile:{id:owner,status:'active',role:'member'},supabase}});assert.equal(foreign.status,403);
 let accessChecks=0;const expiring={...supabase,async rpc(name){assert.equal(name,'studio_project_can_read_v1');return {data:++accessChecks<3,error:null}}};
 const expired=await createCoherentProjectExportHandler(provider)({params:{id:pid,format:'zip'},locals:{user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase:expiring,studioSupportLocal:false,studioArtistLocal:false}});
 assert.equal(expired.status,403);assert.equal(accessChecks,3);
});
