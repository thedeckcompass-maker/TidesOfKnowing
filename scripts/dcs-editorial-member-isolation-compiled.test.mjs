import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {experimental_AstroContainer as Container} from 'astro/container';

// Additional targeted checks of query-parameter isolation in the active pinned
// compiled Account page. Existing allowance/state suites are reused, not rerun.
const root='C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website';
const packet=root+'/DCS-STAFF-SERVICES-PERFORMANCE-20261111';
const artifact=packet+'/compiled-candidate';
const output=root+'/DCS-EDITORIAL-MEMBER-ACCEPTANCE-20261111';
fs.mkdirSync(output,{recursive:true});
const entryText=fs.readFileSync(artifact+'/server/entry.mjs','utf8');
const line=entryText.split('\n').find(x=>x.startsWith('var _manifest = deserializeManifest('));
const manifest=JSON.parse(line.slice(line.indexOf('(')+1,line.lastIndexOf(');')));
const container=await Container.create({manifest:{inlinedScripts:new Map(manifest.inlinedScripts)},resolve:id=>'/'+manifest.entryModules[id]});
const file=fs.readdirSync(artifact+'/server/chunks').filter(x=>x.endsWith('.mjs')).find(x=>{const text=fs.readFileSync(artifact+'/server/chunks/'+x,'utf8');return text.includes('/src/pages/studio/account.astro')&&text.includes('var page =');});
const component=(await import(pathToFileURL(artifact+'/server/chunks/'+file))).page().default;
const compiled=(await build({entryPoints:[packet+'/build-root/src/lib/studio/serviceRecords.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent'})).outputFiles[0].text;
const mod={exports:{}};new Function('module','exports','require',compiled)(mod,mod.exports,createRequire(import.meta.url));
const staff='77777777-7777-4777-8777-777777777777',a='22222222-2222-4222-8222-222222222222',b='33333333-3333-4333-8333-333333333333';
const store=mod.exports.createServiceRecordStore(staff,[{id:'TEST-COLLABORATE',person:{id:a,name:'TEST owner A'},programme:'collaborate',start:'2026-11-03'},{id:'TEST-DEVELOP',person:{id:b,name:'TEST owner B'},programme:'develop',start:'2026-11-03'}],()=>new Date('2026-11-11T22:00:00Z'));
const original=JSON.stringify(store.snapshot());
function db(){return{from(table){const q={select(){return q},eq(){return q},neq(){return q},is(){return q},order(){return q},limit(){return q},maybeSingle:async()=>({data:table==='community_usernames'?{username:'TESTMember'}:null,error:null}),then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return q;}};}
const checks=[];let readCount=0;
for(const [actor,foreign,own,other,consultations,reviews] of [[a,b,'TEST-COLLABORATE','TEST-DEVELOP',1,1],[b,a,'TEST-DEVELOP','TEST-COLLABORATE',4,2]]){
 for(const query of [`?entry=${other}&view=record&admin=true&userId=${foreign}`,`?enrolmentId=${other}&ownerId=${foreign}&actor=${foreign}`]){
  const port={read:async(who,admin)=>{readCount++;assert.equal(who,actor);assert.equal(admin,false);return store.read(who,false);},assessmentSources:async()=>[]};
  const response=await container.renderToResponse(component,{request:new Request('https://synthetic.invalid/studio/account/'+query),locals:{user:{id:actor,email:'member@example.invalid'},profile:{id:actor,role:'member',status:'active',display_name:'TEST member'},supabase:db(),studioServiceRecords:port,studioSupportHostedEnabled:true}});
  const html=await response.text();assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private.*no-store/);
  assert(html.includes('service-entry-'+own));assert(!html.includes('service-entry-'+other));
  assert(html.includes(`${consultations} included · 0 completed · 0 pending · ${consultations} available to request now`));
  assert(html.includes(`${reviews} included · 0 delivered · 0 pending · ${reviews} available to request now`));
  assert(html.includes('3 Nov 2026')&&html.includes('3 May 2027')&&html.includes('3 Nov 2027'));
  assert.equal((html.match(/value="consultation-request"/g)||[]).length,1);
  assert.equal((html.match(/value="review-request"/g)||[]).length,1);
  checks.push({programme:actor===a?'collaborate':'develop',case:query.startsWith('?entry=')?'foreign entry/admin/view/identity parameters':'foreign enrolment/owner/actor parameters',passed:true,onlyOwnProgramme:true,requestControlsForOwnEntry:true});
 }
}
assert.equal(JSON.stringify(store.snapshot()),original);
const result={passed:true,artifact,compiledAccountChunk:file,checks,readCount,syntheticOnly:true,productionConnections:0,productionRequests:0,productionMutations:0,syntheticMutations:0,retainedAcceptedEvidence:['FOCUSED-LOCAL-PERFORMANCE-RESULTS.json: distinct member owner-filtered output and linked assessment audience checks','DCS-STAFF-SERVICES-ALLOWANCE-20261111/FOCUSED-COMPILED-UI-RESULTS.json: both tier displays, pending/exhausted/expired states and Editorial Support navigation'],scopeLimitation:'Synthetic compiled rendering verifies query-parameter isolation and contracts; it does not establish hosted member sessions or end-to-end production denial.',utc:new Date().toISOString()};
fs.writeFileSync(path.join(output,'FOCUSED-COMPILED-MEMBER-ISOLATION-RESULTS.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
