import test from 'node:test';import assert from 'node:assert/strict';
import {checkTransport} from './check-stage9-preview-transport.mjs';
const host='db.utzcmbidotxgmulguzxo.supabase.co';
const fp='80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA';
async function run({error,identity={},options={},fingerprint=fp}={}){
 let connects=0;const queries=[],output=[];
 class Mock{
  constructor(p){this.connectionParameters={...p,...options};this.connection={stream:{encrypted:true,authorized:true,getPeerCertificate:()=>({subjectaltname:`DNS:${host}`})}};}
  async connect(){connects++;if(error){const e=new Error('PRIVATE synthetic-password postgres://must-not-appear');e.code=error;throw e;}}
  async query(q){queries.push(q);assert.match(q,/^SELECT /);assert.ok(!/pg_dump|SET ROLE|INSERT|UPDATE|DELETE|CREATE|ALTER/i.test(q));return {rowCount:1,rows:[{db:'postgres',login:'dcs_exchange_connection',effective_user:'dcs_exchange_connection',ssl:true,can_connect:true,...identity}]};}
  async end(){}
 }
 const code=await checkTransport({ClientClass:Mock,password:'synthetic-password',loadSsl:async()=>({rejectUnauthorized:true,servername:host,ca:'synthetic CA'}),fingerprint:()=>fingerprint,write:r=>output.push(JSON.parse(r))});
 assert.ok(!JSON.stringify(output).includes('synthetic-password'));assert.ok(!JSON.stringify(output).includes('postgres://'));return {code,queries,output,connects};
}
test('actual restricted-login orchestration succeeds with verified TLS/CA and SELECT-only identity',async()=>{const r=await run();assert.equal(r.code,0);assert.equal(r.queries.length,1);assert.equal(r.output[0].passwordAccepted,true);});
test('authentication, authorisation, TLS and network failures have distinct safe categories',async()=>{
 for(const [error,category] of [['28P01','DATABASE_AUTHENTICATION_FAILED'],['28000','DATABASE_AUTHORIZATION_FAILED'],['42501','DATABASE_PERMISSION_DENIED'],['ERR_TLS_CERT_ALTNAME_INVALID','TLS_HOSTNAME_MISMATCH'],['SELF_SIGNED_CERT_IN_CHAIN','TLS_CERTIFICATE_CHAIN_UNTRUSTED'],['ECONNREFUSED','DATABASE_CONNECTION_REFUSED']]){const r=await run({error});assert.equal(r.code,1);assert.equal(r.output[0].category,category);assert.equal(r.queries.length,0);}
});
test('wrong CA fails before connection; wrong target/identity and missing CONNECT fail closed',async()=>{
 const ca=await run({fingerprint:'different'});assert.equal(ca.connects,0);assert.equal(ca.output[0].category,'PREVIEW_PROVIDER_CA_HASH_MISMATCH');
 for(const changes of [{options:{host:'db.vbdqvjvhjleqdadiiqjx.supabase.co'}},{identity:{login:'postgres'}},{identity:{can_connect:false}}]){const r=await run(changes);assert.equal(r.code,1);if(changes.options)assert.equal(r.connects,0);}
});
