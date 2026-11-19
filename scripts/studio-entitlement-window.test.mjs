import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';

async function load(){const output=await build({stdin:{contents:`export {studioPaidAccessState,effectiveStudioAccess,studioAccessResponse,studioReadAccessResponse,studioAccountAccessResponse} from './src/lib/studio/access.ts'; export {projectPaidAccess} from './src/lib/studio/billingAccess.ts'; export {standardPromise,OFFER_VERSION} from './src/lib/studio/serviceOffers.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'}});const mod={exports:{}};new Function('module','exports','require',output.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));return mod.exports;}
const owner='11111111-1111-4111-8111-111111111111',profile={id:owner,status:'active',role:'member'},day=86400000;
test('paid grant expires into exactly 28 days of read-grace, never paid editing',async()=>{
 const {studioPaidAccessState,effectiveStudioAccess,studioAccountAccessResponse}=await load(),end=Date.parse('2026-11-01T00:00:00Z');
 const grant={user_id:owner,phase:'paid',starts_at:'2026-01-01T00:00:00Z',expires_at:'2026-11-01T00:00:00Z',revoked_at:null};
 assert.equal(studioPaidAccessState(profile,grant,end-1),'active');assert.equal(effectiveStudioAccess(profile,grant,end-1),true);
 assert.equal(studioPaidAccessState(profile,grant,end),'read-grace');assert.equal(studioPaidAccessState(profile,grant,end+28*day-1),'read-grace');assert.equal(studioPaidAccessState(profile,grant,end+28*day),'expired');
 assert.equal(effectiveStudioAccess(profile,grant,end),false);assert.equal(effectiveStudioAccess(profile,grant,end+28*day),false);
 assert.equal(await studioAccountAccessResponse({id:owner},profile),null);
 assert.equal(studioPaidAccessState(profile,{...grant,revoked_at:'2026-10-01T00:00:00Z'},end),'unavailable');
 assert.equal(studioPaidAccessState(profile,{...grant,expires_at:'bad'},end),'unavailable');
 assert.equal(studioPaidAccessState({...profile,status:'inactive'},grant,end),'unavailable');
 assert.equal(studioPaidAccessState({...profile,id:'another'},grant,end),'unavailable');
});
test('existing billing projection keeps an active Create grant when a programme expired',async()=>{
 const {projectPaidAccess,standardPromise,OFFER_VERSION,studioPaidAccessState}=await load(),now=new Date('2026-11-01T00:00:00Z');
 const promise=standardPromise('develop','2024-01-01');
 const programme={id:'programme',ownerId:owner,promise,consultations:[],reviews:[],payment:{billing:'once',enrolledAt:'2024-01-01T00:00:00Z',requiredPayments:1,paidInvoiceIds:['synthetic'],failures:[]}};
 const create={id:'create',ownerId:owner,content:'preserved synthetic record'};
 const slice={ownerId:owner,entries:[programme,create],enrolmentIntents:[{id:'programme',ownerId:owner,offer:'develop',promise},{id:'create',ownerId:owner,offer:'create',promise:{version:OFFER_VERSION},paidPeriod:{startsAt:'2026-10-01T00:00:00Z',endsAt:'2026-12-01T00:00:00Z'}}],access:null,receipts:[],revision:'fixture'};
 const original=structuredClone(slice),result=projectPaidAccess(slice,'synthetic-event','synthetic-payload',now);
 assert.equal(result.result.tier,'create');assert.equal(result.slice.access.expires_at,'2026-12-01T00:00:00Z');assert.equal(studioPaidAccessState(profile,result.slice.access,now.getTime()),'active');
 assert.deepEqual(slice,original);assert.equal(result.slice.entries.find(e=>e.id==='create').content,'preserved synthetic record');assert.deepEqual(result.slice.entries.find(e=>e.id==='programme').promise,promise);
});
test('an active programme takes precedence over an expired Create period without changing work',async()=>{
 const {projectPaidAccess,standardPromise,OFFER_VERSION,studioPaidAccessState}=await load(),now=new Date('2026-11-01T00:00:00Z');
 const promise=standardPromise('collaborate','2026-06-01');
 const programme={id:'programme',ownerId:owner,promise,consultations:[],reviews:[],payment:{billing:'once',enrolledAt:'2026-06-01T00:00:00Z',requiredPayments:1,paidInvoiceIds:['synthetic'],failures:[]}};
 const oldCreate={id:'create',ownerId:owner,content:'preserved'};
 const slice={ownerId:owner,entries:[programme,oldCreate],enrolmentIntents:[{id:'programme',ownerId:owner,offer:'collaborate',promise},{id:'create',ownerId:owner,offer:'create',promise:{version:OFFER_VERSION},paidPeriod:{startsAt:'2025-01-01T00:00:00Z',endsAt:'2025-12-01T00:00:00Z'}}],access:null,receipts:[],revision:'fixture'};
 const result=projectPaidAccess(slice,'synthetic-event','synthetic-payload',now);
 assert.equal(result.result.tier,'create');assert.equal(Date.parse(result.slice.access.expires_at),Date.parse('2027-06-01T00:00:00Z'));assert.equal(studioPaidAccessState(profile,result.slice.access,now.getTime()),'active');
 assert.deepEqual(result.slice.entries.find(e=>e.id==='programme').promise,promise);assert.equal(result.slice.entries.find(e=>e.id==='create').content,'preserved');
});
test('a future Create period does not grant paid access before it begins',async()=>{
 const {projectPaidAccess,OFFER_VERSION}=await load();
 const slice={ownerId:owner,entries:[{id:'create',ownerId:owner}],enrolmentIntents:[{id:'create',ownerId:owner,offer:'create',promise:{version:OFFER_VERSION},paidPeriod:{startsAt:'2027-01-01T00:00:00Z',endsAt:'2028-01-01T00:00:00Z'}}],access:null,receipts:[],revision:'fixture'};
 const result=projectPaidAccess(slice,'future','event',new Date('2026-11-01T00:00:00Z'));assert.equal(result.result.tier,'explore');assert.equal(result.slice.access,null);
});
test('expired projected grant is denied by the actual paid gate while the active account stays eligible',async()=>{
 const {studioAccessResponse,studioAccountAccessResponse}=await load();
 const grant={user_id:owner,phase:'paid',starts_at:'2020-01-01T00:00:00Z',expires_at:'2021-01-01T00:00:00Z',revoked_at:null};
 const client={from(table){assert.equal(table,'studio_access');const q={select(){return q},eq(){return q},async maybeSingle(){return {data:grant,error:null}}};return q}};
 assert.equal((await studioAccessResponse({id:owner},profile,client)).status,403);assert.equal(await studioAccountAccessResponse({id:owner},profile,client),null);
});
test('known integration gap: the current account-level read gate does not enforce the 28-day project boundary',async()=>{
 const {studioReadAccessResponse,studioPaidAccessState}=await load();
 const grant={user_id:owner,phase:'paid',starts_at:'2020-01-01T00:00:00Z',expires_at:'2021-01-01T00:00:00Z',revoked_at:null};
 const client={from(){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:grant,error:null}}};return q}};
 assert.equal(studioPaidAccessState(profile,grant),'expired');
 // Do not confuse this observed legacy result with accepted expiry enforcement.
 assert.equal(await studioReadAccessResponse({id:owner},profile,client),null);
});
test('expiry projection retains the original entitlement baseline and service records',async()=>{
 const {projectPaidAccess}=await load();const grant={user_id:owner,phase:'paid',onboarding_date:'2024-01-01',time_zone:'UTC',starts_at:'2024-01-01T00:00:00Z',expires_at:'2025-01-01T00:00:00Z',revoked_at:null,updated_by:'admin',updated_at:'2024-01-01T00:00:00Z'};
 const slice={ownerId:owner,entries:[{id:'historical',ownerId:owner,content:'preserved'}],enrolmentIntents:[],access:grant,receipts:[],revision:'fixture'},original=structuredClone(slice);
 const result=projectPaidAccess(slice,'expiry','event',new Date('2026-11-01T00:00:00Z'));
 assert.equal(result.result.tier,'explore');assert.equal(result.slice.entries[0].content,'preserved');assert.deepEqual(result.slice.baseline.original,grant);assert.deepEqual(slice,original);
});
