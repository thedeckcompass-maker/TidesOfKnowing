import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

async function load(entry) {
  const output = await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'}});
  const module={exports:{}}; new Function('module','exports','require',output.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));return module.exports;
}
const owner='11111111-1111-4111-8111-111111111111', project='22222222-2222-4222-8222-222222222222', card='33333333-3333-4333-8333-333333333333';
function fixture({own=true,error=null}={}) {
 const operations=[];
 const supabase={from(table){const q={select(){return q},update(value){operations.push({table,value});return q},eq(){return q},is(){return q},neq(){return q},async maybeSingle(){return table==='studio_projects'&&!operations.length?{data:own?{id:project}:null,error:null}:{data:error?null:{id:table==='studio_cards'?card:project},error}}};return q}};
 return {operations,locals:{user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase}};
}
function request(values,origin='https://studio.test') {const body=new FormData();for(const [k,v] of Object.entries(values))body.set(k,v);return new Request('https://studio.test/api',{method:'POST',headers:{origin},body});}
test('paid and administrator access remains available, inactive or mismatched accounts are denied',async()=>{
 const {effectiveStudioAccess,studioAccountAccessResponse}=await load('src/lib/studio/access.ts');
 const profile={id:owner,status:'active',role:'member'},access={user_id:owner,starts_at:'2020-01-01T00:00:00Z',expires_at:'2099-01-01T00:00:00Z',revoked_at:null};
 assert.equal(effectiveStudioAccess(profile,access),true);assert.equal(effectiveStudioAccess({...profile,role:'admin'},null),true);
 assert.equal(await studioAccountAccessResponse({id:owner},profile),null);
 assert.equal((await studioAccountAccessResponse({id:owner},{...profile,status:'inactive'})).status,403);
 assert.equal((await studioAccountAccessResponse({id:card},profile)).status,403);
});
test('project write gate requires a positive server decision and fails closed',async()=>{
 const {studioProjectWriteAccessResponse}=await load('src/lib/studio/access.ts'),user={id:owner},profile={id:owner,status:'active',role:'member'};
 const client=value=>({async rpc(name,args){assert.equal(name,'studio_project_can_edit_v1');assert.equal(args.p_project,project);return value}});
 assert.equal(await studioProjectWriteAccessResponse(user,profile,client({data:true,error:null}),project),null);
 assert.equal((await studioProjectWriteAccessResponse(user,profile,client({data:false,error:null}),project)).status,403);
 assert.equal((await studioProjectWriteAccessResponse(user,profile,client({data:null,error:{message:'unavailable'}}),project)).status,503);
 assert.equal((await studioProjectWriteAccessResponse(user,{...profile,id:card},client({data:true,error:null}),project)).status,403);
});
test('project read and download gate requires a positive server decision',async()=>{
 const {studioProjectReadAccessResponse}=await load('src/lib/studio/access.ts'),user={id:owner},profile={id:owner,status:'active',role:'member'};
 const client=value=>({async rpc(name,args){assert.equal(name,'studio_project_can_read_v1');assert.equal(args.p_project,project);return value}});
 assert.equal(await studioProjectReadAccessResponse(user,profile,client({data:true,error:null}),project),null);
 assert.equal((await studioProjectReadAccessResponse(user,profile,client({data:false,error:null}),project)).status,403);
 assert.equal((await studioProjectReadAccessResponse(user,profile,client({data:null,error:{message:'unavailable'}}),project)).status,503);
});
test('project lifecycle requires origin and explicit confirmation; deletion is soft',async()=>{
 const {POST}=await load('src/pages/api/studio/projects/[id]/lifecycle.ts');const f=fixture();
 assert.equal((await POST({request:request({action:'delete',confirm:'yes'},'https://other.test'),locals:f.locals,params:{id:project}})).status,403);
 assert.equal((await POST({request:request({action:'delete'}),locals:f.locals,params:{id:project}})).status,400);
 assert.equal(f.operations.length,0);
 assert.equal((await POST({request:request({action:'delete',confirm:'yes'}),locals:f.locals,params:{id:project}})).status,303);
 assert.ok(f.operations[0].value.deleted_at);
});
test('card lifecycle denies foreign project and reports restoration capacity',async()=>{
 const {POST}=await load('src/pages/api/studio/cards/[id]/lifecycle.ts');
 const foreign=fixture({own:false});assert.equal((await POST({request:request({action:'restore',confirm:'yes',project_id:project}),locals:foreign.locals,params:{id:card}})).status,404);assert.equal(foreign.operations.length,0);
 const full=fixture({error:{message:'STUDIO_EXPLORE_CARD_CAPACITY'}});const result=await POST({request:request({action:'restore',confirm:'yes',project_id:project}),locals:full.locals,params:{id:card}});
 assert.equal(result.status,303);assert.match(decodeURIComponent(result.headers.get('location')),/ten active cards/);assert.deepEqual(full.operations[0].value,{deleted_at:null});
});
test('deleted project offers its owner a reversible card removal before restore',async()=>{
 const {POST}=await load('src/pages/api/studio/cards/[id]/lifecycle.ts');let operation;
 const q={select(){return q},eq(){return q},async maybeSingle(){return {data:{id:project,deleted_at:'2026-01-01',status:'writing'},error:null}}};
 const locals={user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase:{from(){return q},async rpc(name,args){operation={name,args};return {data:true,error:null}}}};
 const response=await POST({request:request({action:'delete',confirm:'yes',project_id:project}),locals,params:{id:card}});
 assert.equal(response.status,303);assert.equal(operation.name,'studio_remove_deleted_project_card_v1');assert.equal(operation.args.target_card,card);
});
test('active free member reaches the real project creation route and sees a capacity refusal',async()=>{
 const {POST}=await load('src/pages/api/studio/projects.ts');let inserted=0;
 const locals={user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase:{from(table){assert.equal(table,'studio_projects');const q={select(){return q},eq(){return q},async maybeSingle(){return {data:null,error:null}},insert(){inserted++;return q},async single(){return {data:null,error:{message:'STUDIO_EXPLORE_PROJECT_CAPACITY'}}}};return q}}};
 const response=await POST({request:request({request_id:project,name:'Synthetic deck',deck_type:'oracle',pathway:'personal'}),locals});
 assert.equal(inserted,1);assert.equal(response.status,303);assert.match(decodeURIComponent(response.headers.get('location')),/one active project/);
 const form=new FormData();for(const [key,value] of Object.entries({request_id:project,name:'Synthetic deck',deck_type:'oracle',pathway:'personal'}))form.set(key,value);
 const json=await POST({request:new Request('https://studio.test/api',{method:'POST',headers:{origin:'https://studio.test',accept:'application/json'},body:form}),locals});
 assert.equal(json.status,409);assert.match((await json.json()).error,/one active project/);
});
test('actual card creation route preserves a free member draft on the capacity error',async()=>{
 const {POST}=await load('src/pages/api/studio/projects/[id]/cards.ts');let inserted=0;
 const locals={user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase:{async rpc(name){assert.equal(name,'studio_project_can_edit_v1');return {data:true,error:null}},from(table){
  const q={select(){return q},eq(){return q},is(){return q},neq(){return q},insert(){inserted++;return q},async maybeSingle(){return {data:table==='studio_projects'?{id:project}:null,error:null}},async single(){return {data:null,error:{message:'STUDIO_EXPLORE_CARD_CAPACITY'}}},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return q;
 }}};
 const body=new FormData();body.set('title','Synthetic draft');body.set('creation_id',card);
 const response=await POST({request:new Request('https://studio.test/api',{method:'POST',headers:{origin:'https://studio.test',accept:'application/json'},body}),locals,params:{id:project}});
 assert.equal(inserted,1);assert.equal(response.status,409);assert.match((await response.json()).error,/ten active cards.*retained/i);
});
test('idea capture sends new card and writing to the single atomic database operation',async()=>{
 const {POST}=await load('src/pages/api/studio/projects/[id]/capture.ts');const section='55555555-5555-4555-8555-555555555555';let call;
 const settings={guidebook_outline_v1:{version:1,revision:0,sections:[{id:section,label:'Meaning',archived:false}],writing:{},history:[],setupConfirmed:true}};
 const db={from(table){const q={select(){return q},eq(){return q},is(){return q},neq(){return q},async maybeSingle(){return {data:table==='studio_projects'?{id:project,owner_id:owner,updated_at:'2026-01-01T00:00:00Z',settings}:null,error:null}},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return q},async rpc(name,args){if(name==='studio_project_can_edit_v1')return {data:true,error:null};call={name,args};return {data:'2026-01-02T00:00:00Z',error:null}}};
 const input={requestId:card,cardId:'',title:'Synthetic card',text:'Synthetic writing',sectionId:section,expectedUpdatedAt:'2026-01-01T00:00:00Z'};
 const request=new Request('https://studio.test/api',{method:'POST',headers:{origin:'https://studio.test','content-type':'application/json'},body:JSON.stringify(input)});
 const response=await POST({request,locals:{user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase:db},params:{id:project}});
 assert.equal(response.status,200);assert.equal(call.name,'studio_capture_atomic_v1');assert.equal(call.args.new_card.id,card);assert.equal(call.args.new_settings.guidebook_outline_v1.writing[card][section],'Synthetic writing');
});
test('expired paid project cannot reach the card capture mutation',async()=>{
 const {POST}=await load('src/pages/api/studio/projects/[id]/capture.ts');let reads=0,mutations=0;
 const db={from(){reads++;throw Error('Project data should not be accessed')},async rpc(name){if(name==='studio_project_can_edit_v1')return {data:false,error:null};mutations++;throw Error('Unexpected mutation')}};
 const response=await POST({request:new Request('https://studio.test/api',{method:'POST',headers:{origin:'https://studio.test','content-type':'application/json'},body:'{}'}),locals:{user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase:db},params:{id:project}});
 assert.equal(response.status,403);assert.equal(reads,0);assert.equal(mutations,0);
});
test('frozen project export reader retains deleted cards while the workspace hides them',async()=>{
 const output=await build({stdin:{contents:`export {frozenSnapshotClient,SNAPSHOT_TABLES} from './src/lib/studio/projectSnapshot.ts'; export {getStudioProjectWorkspace} from './src/lib/studio/queries.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'}});
 const module={exports:{}};new Function('module','exports','require',output.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
 const {frozenSnapshotClient,SNAPSHOT_TABLES,getStudioProjectWorkspace}=module.exports;
 const tables=Object.fromEntries(SNAPSHOT_TABLES.map(t=>[t,[]]));
 tables.studio_projects=[{id:project,owner_id:owner,status:'planning',settings:{},deleted_at:null}];
 tables.studio_cards=[{id:card,project_id:project,sort_order:0,created_at:'1',deleted_at:null},{id:'44444444-4444-4444-8444-444444444444',project_id:project,sort_order:1,created_at:'2',deleted_at:'2026-01-01'}];
 const client=frozenSnapshotClient({ownerId:owner,projectId:project,tables,editorial:{requests:[],replies:[]}},{auth:{}});
 const workspace=await getStudioProjectWorkspace(client,project);assert.deepEqual(workspace.cards.map(c=>c.id),[card]);
 const backup=await client.from('studio_cards').select('*').eq('project_id',project);assert.equal(backup.data.length,2);
});
test('selection hides a deleted card while retaining its decision and rejects unknown references',async()=>{
 const {finalSelection,prepareFinalSelection,selectedCards}=await load('src/lib/studio/finalSelection.ts');
 const removed='44444444-4444-4444-8444-444444444444',cards=[{id:card,title:'Active'}];
 const settings={final_selection_v1:{version:1,revision:2,entries:[{cardId:card,decision:'included'},{cardId:removed,decision:'included'}],history:[]}};
 assert.deepEqual(finalSelection(settings,cards,[removed]).entries,[{cardId:card,decision:'included'}]);
 assert.deepEqual(selectedCards(settings,cards,[removed]).map(c=>c.id),[card]);
 assert.throws(()=>finalSelection(settings,cards,[]),/unavailable or duplicate/);
 const saved=prepareFinalSelection(settings,{expectedRevision:2,entries:[{cardId:card,decision:'aside'}]},cards,'2026-01-01',[removed]);
 assert.deepEqual(saved.final_selection_v1.entries,[{cardId:card,decision:'aside'},{cardId:removed,decision:'included'}]);
 assert.equal(finalSelection(saved,[...cards,{id:removed}]).entries.find(e=>e.cardId===removed).decision,'included');
});
