import {buildSync} from 'esbuild';
import assert from 'node:assert/strict';
import {ledgerDigest,STAFF,TARGETS} from './lib/dcs-test-programme-provisioning.mjs';
const bundle=buildSync({entryPoints:['scripts/lib/dcs-test-programme-composition.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'}).outputFiles[0].text;
const {prepareTestProgrammeOperation}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
let ledger={entries:[],groups:[],quotes:[],receipts:[]},receipts=[];const calls=[],owner=Object.keys(TARGETS)[0];
const connection={transaction:async work=>{let next=structuredClone(ledger),pending=structuredClone(receipts);const result=await work(async(sql,values=[])=>{calls.push(sql);
 if(sql.includes("current_setting('request.jwt.claim.sub'"))return{rows:[{actor:STAFF}]};
 if(sql.startsWith('SELECT body'))return{rows:[{body:next}]};
 if(sql.includes('service_actor_profiles_v1')){assert.equal(values[0],owner);return{rows:[{id:STAFF,role:'admin',status:'active'},{id:owner,role:'member',status:'active'}]};}
 if(sql.startsWith('SELECT actor_id,key,payload,result'))return{rows:pending};
 if(sql.startsWith('UPDATE studio_private.service_ledger_v1 SET body=')){next=JSON.parse(values[0]);return{rows:[]};}
 if(sql.startsWith('INSERT INTO studio_private.service_receipts_v1')){pending.push({actor_id:values[0],key:values[1],payload:values[2],result:JSON.parse(values[3])});return{rows:[]};}
 throw Error('Unexpected repository query');});ledger=next;receipts=pending;return result;}};
const config={enabled:true,projectId:'vbdqvjvhjleqdadiiqjx',verifiedStaffId:STAFF,approvalReference:'SYNTHETIC ONLY',connection};
const command={ownerId:owner,programme:'collaborate',start:'2026-11-03',key:'dcs-permanent-test-collaborate-20261110',label:'TEST Collaborate',expectedLedgerDigest:ledgerDigest(ledger)};
const operation=prepareTestProgrammeOperation(config);await operation(command);assert.equal(ledger.entries.length,1);assert.equal(receipts.length,1);assert.equal((await operation(command)).unchanged,true);assert(!calls.some(s=>/public\.studio_(projects|editorial)|ALTER|GRANT|DELETE/.test(s)));
for(const change of [{enabled:false},{projectId:'other'},{verifiedStaffId:owner}])await assert.rejects(prepareTestProgrammeOperation({...config,...change})(command));
console.log(JSON.stringify({checks:6,actualRepositoryComposition:'PASS',productionConnections:0,source:'synthetic query transport, not live execution'}));
