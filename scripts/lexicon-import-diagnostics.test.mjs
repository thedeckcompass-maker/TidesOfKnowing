import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rootCertificates} from 'node:tls';
import {X509Certificate,createHash} from 'node:crypto';
import {runPreviewImport} from './import-lexicon-preview.mjs';
import {previewSslOptions,PREVIEW_REF,PREVIEW_DB} from './lib/lexicon-preview-sql.mjs';

const fixture=await readFile('scripts/fixtures/lexicon-demo-20261114.json');
// Offline mock identities; never read a retained real Preview import instruction.
const config={projectRef:PREVIEW_REF,ownerId:'11111111-1111-4111-8111-111111111111',actorId:'11111111-1111-4111-8111-111111111111',projectId:'22222222-2222-4222-8222-222222222222',deckType:'hybrid',pathway:'personal',fixtureSha256:createHash('sha256').update(fixture).digest('hex')};
const pem=rootCertificates.find(p=>{const c=new X509Certificate(p);return c.ca&&c.checkIssued(c)&&c.verify(c.publicKey)&&Date.parse(c.validFrom)<Date.now()&&Date.parse(c.validTo)>Date.now();});
const bytes=Buffer.from(pem);
const caOptions={caFile:'offline-public-root.crt',caSha256:createHash('sha256').update(bytes).digest('hex'),caSource:`SUPABASE_DASHBOARD_${PREVIEW_REF}`,readCertificate:async()=>bytes};
const privateText='MOCK-SECRET-NEVER-PRINT';
const failure=code=>Object.assign(new Error(privateText),{code,detail:privateText,stack:privateText});

async function exercise({failConnect,failSql,missingGrant=false,rollbackFails=false,badHash=false,loadSsl=()=>previewSslOptions(caOptions),tlsBypass}={}){
 const queries=[],output=[],errors=[];let driverConfig,connected=false;
 class MockClient{
  constructor(c){driverConfig=c;this.connectionParameters=c;this.connection={stream:{encrypted:true,authorized:true,getPeerCertificate:()=>({subjectaltname:`DNS:${PREVIEW_DB.host}`})}};}
  async connect(){connected=true;if(failConnect)throw failure(failConnect);}
  async end(){}
  async query(sql){
   queries.push(sql);
   if(failSql&&sql.includes(failSql))throw failure('42501');
   if(sql==='rollback'&&rollbackFails)throw failure('ECONNRESET');
   if(sql.startsWith('select current_database'))return {rowCount:1,rows:[{db:'postgres',operator:'postgres',effective_operator:'postgres',ssl:true,pid:42}]};
   if(sql.includes('from dcs_demo.environment'))return {rowCount:1,rows:[{project_ref:PREVIEW_REF,ssl:true}]};
   if(sql.includes('from dcs_demo.preview_owners'))return {rowCount:1,rows:[{}]};
   if(sql.includes('id<>'))return {rowCount:0,rows:[]};
   if(sql.includes('for update of p,g'))return {rowCount:missingGrant?0:1,rows:missingGrant?[]:[{id:config.ownerId}]};
   if(sql.includes('information_schema.columns'))return {rowCount:1,rows:[{table_name:'studio_cards'}]};
   if(sql.includes('select 1 from dcs_demo.imports'))return {rowCount:0,rows:[]};
   return {rowCount:1,rows:[]};
  }
 }
 const exit=await runPreviewImport(['--import','fixture-config.json',`AUTHORIZE PREVIEW LEXICON ${PREVIEW_REF}`],{
  ClientClass:MockClient,password:privateText,loadSsl,tlsBypass,
  readInput:async file=>file instanceof URL?fixture:JSON.stringify({...config,...(badHash?{fixtureSha256:'wrong'}:{})}),
  write:text=>output.push(JSON.parse(text)),writeError:text=>errors.push(JSON.parse(text))
 });
 assert.doesNotMatch(JSON.stringify({output,errors}),new RegExp(privateText));
 return {exit,driverConfig,queries,output,errors,connected};
}

test('existing importer passes the verified provider CA and full TLS to pg, using actual executor',async()=>{
 const r=await exercise();assert.equal(r.exit,0);assert.equal(r.driverConfig.ssl.ca,pem);
 assert.equal(r.driverConfig.ssl.rejectUnauthorized,true);assert.equal(r.driverConfig.ssl.servername,PREVIEW_DB.host);
 assert.equal(r.output[0].state,'IMPORTED_PREVIEW');assert.equal(r.output[0].cards,22);
 assert.equal(r.queries.filter(q=>q.startsWith('insert into public."studio_cards"')).length,22);
 assert.ok(r.queries.includes('commit'));assert.equal(r.errors.length,0);
});

for(const [code,category] of [['28P01','DATABASE_AUTHENTICATION_FAILED'],['SELF_SIGNED_CERT_IN_CHAIN','TLS_CERTIFICATE_CHAIN_UNTRUSTED'],['ECONNREFUSED','DATABASE_CONNECTION_REFUSED']]){
 test(`connection failure is safely classified: ${code}`,async()=>{
  const r=await exercise({failConnect:code});assert.equal(r.exit,1);assert.equal(r.errors[0].stage,'CONNECT');
  assert.equal(r.errors[0].category,category);assert.equal(r.queries.length,0);assert.equal(r.output.length,0);
 });
}
test('CA failure, TLS bypass and changed fixture stop before connecting',async()=>{
 for(const options of [{loadSsl:()=>previewSslOptions({...caOptions,caSha256:'0'.repeat(64)})},{tlsBypass:'0'},{badHash:true}]){
  const r=await exercise(options);assert.equal(r.exit,1);assert.equal(r.connected,false);assert.equal(r.queries.length,0);
 }
});
test('missing entitlement is distinguishable from SQL execution and rolls back',async()=>{
 const r=await exercise({missingGrant:true});assert.equal(r.exit,1);
 assert.equal(r.errors[0].stage,'ENTITLEMENT_VERIFICATION');assert.equal(r.errors[0].category,'ACTIVE_DEMO_ENTITLEMENT_REQUIRED');
 assert.equal(r.queries.at(-1),'rollback');assert.ok(!r.queries.some(q=>q.startsWith('insert into')));
});
for(const [failSql,stage] of [['insert into public."studio_projects"','PROJECT_INSERT'],['insert into public."studio_import_records"','PROVENANCE_INSERT'],['insert into dcs_demo.imports','IMPORT_RECEIPT']]){
 test(`actual executor reports ${stage} without masking the provider error`,async()=>{
  const r=await exercise({failSql,rollbackFails:true});assert.equal(r.exit,1);assert.equal(r.errors[0].stage,stage);
  assert.equal(r.errors[0].category,'DATABASE_PERMISSION_DENIED');assert.equal(r.errors[0].receiptCheckRequired,true);
  assert.equal(r.queries.at(-1),'rollback');assert.ok(!r.queries.includes('commit'));assert.equal(r.output.length,0);
 });
}
