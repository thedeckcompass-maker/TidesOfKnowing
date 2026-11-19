import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {experimental_AstroContainer as Container} from 'astro/container';
const compiled=await build({stdin:{contents:"export * from './src/lib/studio/lexiconEditorialDemo.ts';export * from './src/lib/studio/serviceOffers.ts';export * from './src/lib/studio/editorialPartnership.ts';export {serviceRecordPost} from './src/pages/api/studio/service-records.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env':'{}'}});
const module={exports:{}};new Function('module','exports','require',compiled.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
const {prepareLexiconEditorialDemo,lexiconEditorialFixture,STANDARD_OFFERS,partnershipState,editorialActivity,serviceRecordPost}=module.exports;
const seed=JSON.parse(fs.readFileSync('scripts/fixtures/lexicon-editorial-demo-20261117.json','utf8'));
const origin='https://tidesofknowing-dcs-lexicon-preview.tidesofknowing.workers.dev',now=Date.parse('2026-11-17T16:00:00Z');
function locals(){
 const reads=[];
 const result={user:{id:seed.ownerId},profile:{id:seed.ownerId,status:'active',role:'member'},serverRuntime:{env:{STUDIO_DEPLOYMENT_TARGET:'lexicon-preview',PUBLIC_SUPABASE_URL:'https://utzcmbidotxgmulguzxo.supabase.co',STUDIO_LEXICON_EDITORIAL_DEMO:seed.kind}},supabase:{auth:{getUser:async()=>({data:{user:{id:seed.ownerId}},error:null})},from(table){reads.push(table);assert.equal(table,'studio_projects');const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:{id:seed.projectId,owner_id:seed.ownerId},error:null})};return q;},rpc:async(name,args)=>{reads.push(name);assert.equal(name,'studio_project_can_edit_v1');assert.equal(args.p_project,seed.projectId);return {data:true,error:null};}},reads};
 return result;
}
test('real Develop promise derives balances and representative activity without payment or new entitlements',()=>{
 const data=lexiconEditorialFixture(now),entry=data.entries[0],state=partnershipState(data,seed.ownerId,null,now);
 assert.equal(entry.promise.benefits.groups,STANDARD_OFFERS.develop.groups);assert.equal(entry.promise.benefits.consultations,4);assert.equal(entry.promise.benefits.assessments,2);
 assert.equal(entry.groupsAttended,1);assert.equal(entry.groupsRemaining,7);assert.equal(state.consultations.completed,1);assert.equal(state.consultations.requestable,3);assert.equal(state.reviews.requestable,2);
 assert.equal(entry.payment,undefined);assert.equal(data.demonstration.readOnly,true);
 assert.equal(editorialActivity(entry,data.groups).filter(r=>r.consumed).length,2);
});
test('page-scoped provider requires exact owner, project, active grant proof and preview-only opt-in',async()=>{
 const l=locals(),demo=await prepareLexiconEditorialDemo(l,origin,now);assert.ok(demo);assert.equal((await demo.provider.read(seed.ownerId)).entries.length,1);
 assert.deepEqual(l.reads,['studio_projects','studio_project_can_edit_v1']);
 for(const change of [l=>{delete l.serverRuntime.env.STUDIO_LEXICON_EDITORIAL_DEMO;},l=>{l.user.id='foreign';},l=>{l.profile.status='blocked';},l=>{l.profile.role='admin';},l=>{l.serverRuntime.env.PUBLIC_SUPABASE_URL='https://vbdqvjvhjleqdadiiqjx.supabase.co';},l=>{l.studioServiceRecords={read(){}};}]){
  const l=locals();change(l);assert.equal(await prepareLexiconEditorialDemo(l,origin,now),null);
 }
 assert.equal(await prepareLexiconEditorialDemo(locals(),'https://www.tidesofknowing.com',now),null);
 assert.equal(await prepareLexiconEditorialDemo(locals(),origin,Date.parse(seed.accessEndsAt)),null);
 const denied=locals();denied.supabase.rpc=async()=>({data:false,error:null});assert.equal(await prepareLexiconEditorialDemo(denied,origin,now),null);
 const wrong=locals();wrong.supabase.from=()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:seed.projectId,owner_id:'foreign'},error:null})});assert.equal(await prepareLexiconEditorialDemo(wrong,origin,now),null);
});
test('synthetic records cannot be read by admin/foreign users or invoke booking/payment mutations',async()=>{
 const demo=await prepareLexiconEditorialDemo(locals(),origin,now);
 await assert.rejects(demo.provider.read('foreign'));await assert.rejects(demo.provider.read(seed.ownerId,true));
 assert.throws(()=>demo.provider.act(seed.ownerId,{action:'consultation-request'}),/Read-only demonstration/);
 assert.throws(()=>demo.provider.quotationRead(seed.ownerId),/Read-only demonstration/);
 const request=()=>new Request(origin+'/api/studio/service-records',{method:'POST',headers:{origin},body:new URLSearchParams({action:'request-group',key:'synthetic',enrolmentId:seed.enrolmentId})});
 const post=serviceRecordPost(async()=>{throw Error('MUST_NOT_LOOK_UP_EMAIL')});
 assert.equal((await post({request:request(),locals:locals()})).status,503);
 assert.equal((await post({request:request(),locals:{...locals(),studioServiceRecords:demo.provider}})).status,409);
});

const stage=process.env.DCS_EDITORIAL_TEST_BUILD;
test('compiled real Editorial Support route renders history, notes, balances and navigation with actions disabled',{skip:!stage},async()=>{
 const artifact=path.resolve(stage,'dist'),chunks=path.join(artifact,'server/chunks');
 assert.ok(path.resolve(stage).startsWith(path.resolve('.preview-builds')+path.sep));
 const line=fs.readFileSync(path.join(artifact,'server/entry.mjs'),'utf8').split('\n').find(x=>x.startsWith('var _manifest = deserializeManifest('));
 const manifest=JSON.parse(line.slice(line.indexOf('(')+1,line.lastIndexOf(');')));
 const container=await Container.create({manifest:{inlinedScripts:new Map(manifest.inlinedScripts)},resolve:id=>'/'+manifest.entryModules[id]});
 const file=fs.readdirSync(chunks).find(file=>file.endsWith('.mjs')&&fs.readFileSync(path.join(chunks,file),'utf8').includes('/src/pages/studio/editorial-support.astro'));
 assert.ok(file);const page=(await import(pathToFileURL(path.join(chunks,file)))).page().default;
 for(const view of ['overview','consultations','groups','included','reviews']){
  const request=new Request(origin+'/studio/editorial-support/?view='+view);
  const html=await container.renderToString(page,{request,locals:locals()});
  const text=html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  assert.match(html,/data-editorial-demonstration/);assert.match(html,/<fieldset[^>]*disabled/);
  assert.doesNotMatch(text,/Your support information is unavailable/);
  if(view==='overview'){assert.match(text,/7 remaining/);assert.match(text,/4 included/);assert.match(text,/2 included/);assert.match(html,/view=consultations/);assert.match(html,/view=groups/);}
  if(view==='consultations'){assert.match(text,/No consultation took place/);assert.match(text,/3 available to request/);}
  if(view==='groups'){assert.match(text,/8 included · 1 attended/);assert.match(text,/not a booking/);}
 }
 const l=locals();delete l.serverRuntime.env.STUDIO_LEXICON_EDITORIAL_DEMO;
 const ordinary=await container.renderToString(page,{request:new Request(origin+'/studio/editorial-support/'),locals:l});
 assert.match(ordinary,/Your support information is unavailable/);assert.doesNotMatch(ordinary,/data-editorial-demonstration/);
});
