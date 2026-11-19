import assert from 'node:assert/strict';
import {prepareTestProgrammeProvisioning,ledgerDigest,STAFF,TARGETS} from './lib/dcs-test-programme-provisioning.mjs';
let checks=0;
function fixture(){let state={entries:[{id:'preserved',ownerId:'unrelated',privateFixtureMarker:'preserve'}],groups:[],quotes:[{id:'preserved-quote'}]},receipts=[];return {get state(){return structuredClone(state)},get receipts(){return receipts},repository:{async transaction(work,scope){assert.equal(scope,'ledger-only');let draft=structuredClone(state),pending=structuredClone(receipts);const out=work({load:()=>structuredClone(draft),save:x=>{draft=structuredClone(x)},profile:id=>id===STAFF?{id,role:'admin',status:'active'}:{id,role:'member',status:'active'},receipt:(a,k)=>pending.find(r=>r.actor===a&&r.key===k),putReceipt:(actor,key,payload,result)=>pending.push({actor,key,payload,result})});state=draft;receipts=pending;return out;}}};}
const ownerId=Object.keys(TARGETS)[0],base={ownerId,programme:'collaborate',start:'2026-11-03',key:'dcs-permanent-test-collaborate-20261110',label:'TEST Collaborate'};
const f=fixture(),old=f.state,c={...base,expectedLedgerDigest:ledgerDigest(f.state)},run=prepareTestProgrammeProvisioning({enabled:true,actorId:STAFF,approvalReference:'SYNTHETIC ONLY',repository:f.repository});
const result=await run(c);assert.equal(result.benefits.groups,8);assert.equal(result.benefits.consultations,1);assert.equal(result.benefits.assessments,1);assert.equal(result.editorialEnds,'2027-05-03');assert.equal(result.createEnds,'2027-11-03');assert.deepEqual(f.state.entries[0],old.entries[0]);assert.deepEqual(f.state.quotes,old.quotes);assert.equal(f.state.entries[1].payment,undefined);checks++;
assert.equal((await run(c)).unchanged,true);assert.equal(f.state.entries.length,2);checks++;
for(const edit of [{ownerId:STAFF},{programme:'develop'},{start:'2026-11-04'},{label:'Unlabelled'},{key:'wrong'},{expectedLedgerDigest:'0'.repeat(64)}]){const before=f.state;await assert.rejects(run({...c,...edit}));assert.deepEqual(f.state,before);checks++;}
for(const config of [{enabled:false,actorId:STAFF},{enabled:true,actorId:ownerId}]){await assert.rejects(prepareTestProgrammeProvisioning({...config,approvalReference:'SYNTHETIC ONLY',repository:f.repository})(c));checks++;}
const g=fixture(),dev=Object.keys(TARGETS)[1],devCommand={...base,ownerId:dev,programme:'develop',key:'dcs-permanent-test-develop-20261110',label:'TEST Develop',expectedLedgerDigest:ledgerDigest(g.state)};
const dr=await prepareTestProgrammeProvisioning({enabled:true,actorId:STAFF,approvalReference:'SYNTHETIC ONLY',repository:g.repository})(devCommand);assert.equal(dr.benefits.groups,8);assert.equal(dr.benefits.consultations,4);assert.equal(dr.benefits.assessments,2);checks++;
const stale=fixture();await assert.rejects(prepareTestProgrammeProvisioning({enabled:true,actorId:STAFF,approvalReference:'SYNTHETIC ONLY',repository:stale.repository})({...c,expectedLedgerDigest:'0'.repeat(64)}));assert.equal(stale.state.entries.length,1);checks++;
for(const role of ['admin','inactive']){
 const badRepo={transaction:async work=>work({profile:id=>id===STAFF?{id,role:'admin',status:'active'}:{id,role:role==='admin'?'admin':'member',status:role==='inactive'?'inactive':'active'}})};
 await assert.rejects(prepareTestProgrammeProvisioning({enabled:true,actorId:STAFF,approvalReference:'SYNTHETIC ONLY',repository:badRepo})(c));checks++;
}
const fail=fixture(),failingRepo={transaction:(work,scope)=>fail.repository.transaction(tx=>work({...tx,putReceipt:()=>{throw Error('Synthetic receipt failure')}}),scope)};
await assert.rejects(prepareTestProgrammeProvisioning({enabled:true,actorId:STAFF,approvalReference:'SYNTHETIC ONLY',repository:failingRepo})(c));assert.equal(fail.state.entries.length,1);assert.equal(fail.receipts.length,0);checks++;
console.log(JSON.stringify({syntheticChecks:checks,passed:true,productionConnections:0}));
