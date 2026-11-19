// Operator-only fixture adapter. Not imported by the application or any public route.
// No database connection, credentials, role elevation or production invocation here.
import {createHash} from 'node:crypto';
import {standardPromise} from '../../src/lib/studio/serviceOffers.ts';
export const STAFF='7e3224e7-b303-4150-a45e-dd9a12efdb68';
export const TARGETS=Object.freeze({
 'c2c5cd1b-95c0-480c-9424-66b3f5974d91':'collaborate',
 'c04cc04b-8a55-448a-88e9-3ad48b4a9980':'develop'
});
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
export const ledgerDigest=v=>createHash('sha256').update(canonical(v)).digest('hex');
export function prepareTestProgrammeProvisioning(config){
 return async command=>{
  if(config.enabled!==true||config.actorId!==STAFF||!config.approvalReference?.trim())throw Error('Explicit operator fixture authority required');
  const programme=TARGETS[command.ownerId];
  if(!programme||command.programme!==programme||command.start!=='2026-11-03'||command.key!==`dcs-permanent-test-${programme}-20261110`||!/^TEST /u.test(command.label)||command.label.length>120||!/^[a-f0-9]{64}$/.test(command.expectedLedgerDigest))throw Error('Outside frozen TEST programme scope');
  const payload=canonical({...command,approvalReference:config.approvalReference});
  return config.repository.transaction(tx=>{
   const staff=tx.profile(STAFF),member=tx.profile(command.ownerId);
   if(staff?.id!==STAFF||staff.role!=='admin'||staff.status!=='active'||member?.id!==command.ownerId||member.role!=='member'||member.status!=='active')throw Error('Assigned staff and active ordinary target required');
   const prior=tx.receipt(STAFF,command.key);
   if(prior){if(prior.payload!==payload)throw Error('Conflicting fixture retry');return {...prior.result,unchanged:true};}
   const state=tx.load();
   if(!state||!Array.isArray(state.entries)||!Array.isArray(state.groups)||ledgerDigest(state)!==command.expectedLedgerDigest)throw Error('Ledger state changed or invalid');
   if(state.entries.some(e=>e.id===command.key||e.ownerId===command.ownerId))throw Error('Existing target allocation requires reconciliation');
   const entry={id:command.key,ownerId:command.ownerId,name:command.label,promise:standardPromise(programme,command.start),revision:0,nextGroupRequested:false,consultations:[],reviews:[],fixture:{kind:'explicit-no-charge-test',approvalReference:config.approvalReference,issuedBy:STAFF}};
   // Same approved promise shape as existing seed-based service allocations. No
   // paid invoice, payment attestation, subscription or financial event invented.
   const next=structuredClone(state);next.entries.push(entry);
   const result={saved:true,unchanged:false,id:entry.id,ownerId:entry.ownerId,programme,editorialEnds:entry.promise.editorialEnds,createEnds:entry.promise.createEnds,benefits:entry.promise.benefits,ledgerDigest:ledgerDigest(next)};
   tx.save(next);tx.putReceipt(STAFF,command.key,payload,result);return result;
  },'ledger-only');
 };
}
