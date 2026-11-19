import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from 'esbuild';import {createRequire} from 'node:module';
const packet='C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-WORKBOOK-VOLUME-CORRECTION-20261111',root=packet+'/build-root',checks=[];
async function load(file){const code=(await build({entryPoints:[root+'/'+file],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'}})).outputFiles[0].text;const m={exports:{}};new Function('module','exports','require',code)(m,m.exports,createRequire(import.meta.url));return m.exports;}
const nav=await load('src/lib/studio/navigation.ts'),POST=(await load('src/pages/api/studio/projects.ts')).POST;
const owner='22222222-2222-4222-8222-222222222222',id='11111111-1111-4111-8111-111111111111';
let saved=null,inserts=0,expiry='2099-01-01T00:00:00Z';
function db(){return {from(table){let filters=[],payload;const result=()=>{if(table==='studio_access')return {data:{user_id:owner,starts_at:'2000-01-01T00:00:00Z',expires_at:expiry},error:null};if(table==='studio_projects'){if(payload){if(saved)return {data:null,error:{code:'23505'}};saved={...payload};inserts++;return {data:{id:payload.id},error:null};}return {data:saved&&filters.every(([k,v])=>saved[k]===v)?saved:null,error:null};}throw Error('UNEXPECTED_TABLE');};const q={select(){return q},eq(k,v){filters.push([k,v]);return q},insert(v){payload=v;return q},maybeSingle:async()=>result(),single:async()=>result()};return q;}};}
const locals=()=>({user:{id:owner},profile:{id:owner,status:'active',role:'member'},supabase:db()});
function request(task='workbook',book='concept',extra={}){const f=new FormData();for(const[k,v]of Object.entries({request_id:id,name:'TEST New Deck',deck_type:'oracle',pathway:'personal',task,book,...extra}))f.set(k,v);return new Request('https://studio.test/api/studio/projects',{method:'POST',headers:{origin:'https://studio.test'},body:f});}
try{
 for(const book of ['concept','manuscript','planning']){
  saved=null;const before=inserts;const response=await POST({request:request('workbook',book),locals:locals()});assert.equal(response.status,303);assert.equal(response.headers.get('location'),`/studio/projects/${id}/project-book/?book=${book}`);assert.equal(saved.owner_id,owner);
  const again=await POST({request:request('workbook',book),locals:locals()});assert.equal(again.headers.get('location'),response.headers.get('location'));assert.equal(inserts,before+1);checks.push(`${book}: actual project-create continuation preserves project/volume and owner; idempotent retry does not duplicate`);
 }
 for(const value of ['https://evil.invalid','//evil.invalid','__proto__','planning&task=addcard']){assert.equal(nav.projectCreationDestination(id,'workbook',value),`/studio/projects/${id}/project-book/`);assert(!nav.projectDestination('workbook',null,value).includes('book='));}
 assert.equal(nav.projectDestination('workbook',id),`/studio/projects/${id}/project-book/`);checks.push('Unspecified/invalid volume has approved default and cannot inject destination, task or project');
 saved=null;const before=inserts;assert.equal((await POST({request:request(),locals:{}})).status,303);
 const req=request();assert.equal((await POST({request:new Request(req,{headers:{origin:'https://evil.invalid'}}),locals:locals()})).status,403);
 expiry='2001-01-01T00:00:00Z';assert.equal((await POST({request:request(),locals:locals()})).status,403);expiry='2099-01-01T00:00:00Z';assert.equal(inserts,before);checks.push('Actual create handler denies anonymous, cross-origin and expired authoring without insertion');
 saved={id,owner_id:'99999999-9999-4999-8999-999999999999',settings:{}};const blocked=await POST({request:request(),locals:locals()});assert(!blocked.headers.get('location').includes(`/studio/projects/${id}/project-book/`));assert.equal(inserts,before);checks.push('Foreign project/request identifier cannot be adopted through creation continuation');
 saved=null;const quick=await POST({request:request('addcard','planning'),locals:locals()});assert.equal(quick.headers.get('location'),`/studio/projects/${id}/cards/new/`);checks.push('Actual Quick add creation ignores Workbook volume and keeps original card destination');
 assert.equal(nav.projectCreationDestination(id,'https://evil.invalid','manuscript'),`/studio/projects/${id}/?view=project&created=1`);checks.push('Unsupported task cannot become an external redirect');
}catch(e){process.exitCode=1;checks.push({failure:e.stack});}
fs.writeFileSync(packet+'/CONTRACT-RESULTS.json',JSON.stringify({passed:!process.exitCode,checks,productionRequests:0,syntheticOnly:true},null,2));console.log(JSON.stringify({passed:!process.exitCode,checks},null,2));
