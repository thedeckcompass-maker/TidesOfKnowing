import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import {build} from 'esbuild';
import {transform} from '@astrojs/compiler-rs';
const result=await build({entryPoints:['src/lib/studio/creatorDesk.ts'],bundle:true,format:'cjs',platform:'node',write:false});
const module=new Module(import.meta.filename);module._compile(result.outputFiles[0].text,import.meta.filename);
const {creatorDeskTiles,loadCreatorDesk}=module.exports;
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',project='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function client({saved={data:null,error:null},projects={data:[{id:project,name:'Synthetic'}],error:null}}={}){
 const filters=[];
 return {filters,from(table){const q={select(){return q},eq(k,v){filters.push([table,k,v]);return q},is(){return q},neq(){return q},order:async()=>projects,maybeSingle:async()=>saved};return q;}};
}
test('all seven Desk links remain available even without programme-service records',()=>{
 const expected=['Capture an idea','My projects','Quick add a card','My Project Workbook','Community','The Eight Pillars','Editorial Support'];
 for(const state of ['eligible','not-included','unavailable','disabled-preview']){
  const t=creatorDeskTiles(project,state);assert.deepEqual(t.map(t=>t.label),expected);
  assert.equal(t[2].href,`/studio/projects/${project}/cards/new/`);assert.equal(t[3].href,`/studio/projects/${project}/project-book/`);
  assert.equal(t[6].href,'/studio/editorial-support/');assert.ok(t.every(t=>!t.href.startsWith('http')));
 }
 assert.equal(creatorDeskTiles(undefined,'not-included').length,7);
 assert.match(creatorDeskTiles(undefined,'unavailable')[2].href,/task=addcard/);
});
test('missing persistence is unavailable, never a successful empty inbox; owner filters remain explicit',async()=>{
 const db=client({saved:{data:null,error:{code:'PGRST205'}}});const r=await loadCreatorDesk(db,owner,null,true);
 assert.equal(r.inspirationState,'missing-contract');assert.equal(r.entries,null);assert.equal(r.projects.length,1);assert.equal(r.editorialState,'disabled-preview');
 assert.deepEqual(db.filters,[['studio_projects','owner_id',owner],['studio_creator_inspiration','owner_id',owner]]);
});
test('permission, malformed saved work and project failures remain distinct and fail closed',async()=>{
 for(const saved of [{data:null,error:{code:'42501'}},{data:{inbox:{version:2,entries:[]}},error:null}]){
  const r=await loadCreatorDesk(client({saved}),owner,null);assert.equal(r.inspirationState,'unavailable');assert.equal(r.entries,null);
 }
 const r=await loadCreatorDesk(client({projects:{data:null,error:{code:'42501'}}}),owner,null);assert.equal(r.projects,null);assert.equal(r.inspirationState,'ready');
});
test('only verified service records determine service state; navigation never invents services',async()=>{
 let calls=0;const services={read:async()=>{calls++;return {entries:[{promise:{programme:'develop'}}]}}};
 assert.equal((await loadCreatorDesk(client(),owner,services)).editorialState,'eligible');assert.equal(calls,1);
 assert.equal((await loadCreatorDesk(client(),owner,services,true)).editorialState,'disabled-preview');assert.equal(calls,1);
 assert.equal((await loadCreatorDesk(client(),owner,{read:async()=>{throw Error('unavailable')}})).editorialState,'unavailable');
 const noServices=await loadCreatorDesk(client(),owner,{read:async()=>({entries:[]})});
 assert.equal(noServices.editorialState,'not-included');
 assert.equal(creatorDeskTiles(undefined,noServices.editorialState)[6].href,'/studio/editorial-support/');
});
test('actual Desk component compiles, retains visible failures and uses a same-origin bookmark',async()=>{
 const source=fs.readFileSync('src/pages/studio/creators-desk.astro','utf8');
 const compiled=await transform(source,{filename:'src/pages/studio/creators-desk.astro'});assert.ok(compiled.code);
 assert.match(source,/loadCreatorDesk\(/);assert.match(source,/tiles\.map/);assert.match(source,/missing-contract/);
 assert.match(source,/Programme details have not been checked/);assert.match(source,/loadError\?/);
 assert.match(source,/new URL\('\/studio\/creators-desk\/',Astro.url.origin\)/);
});
