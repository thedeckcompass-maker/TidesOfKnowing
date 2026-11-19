import test from 'node:test';
import assert from 'node:assert/strict';
import {rootCertificates} from 'node:tls';
import {X509Certificate,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PREVIEW_DB,PREVIEW_REF,previewSslOptions} from './lib/lexicon-preview-sql.mjs';
import {runPreviewSql} from './apply-lexicon-preview-sql.mjs';

// An independently bundled public root is used only as an offline test input.
// No production certificate, private key, database or network is used here.
const pem=rootCertificates.find(p=>{const c=new X509Certificate(p);return c.ca&&c.checkIssued(c)&&c.verify(c.publicKey)&&Date.parse(c.validFrom)<Date.now()&&Date.parse(c.validTo)>Date.now();});
const bytes=Buffer.from(pem),cert=new X509Certificate(pem);
const sha=createHash('sha256').update(bytes).digest('hex');
const options={caFile:'synthetic-provider-root.crt',caSha256:sha,caSource:`SUPABASE_DASHBOARD_${PREVIEW_REF}`,readCertificate:async()=>bytes};

test('approved CA is scoped to the existing pinned preview TLS options',async()=>{
 const ssl=await previewSslOptions(options);
 assert.equal(ssl.ca,pem);assert.equal(ssl.rejectUnauthorized,true);assert.equal(ssl.servername,PREVIEW_DB.host);
 assert.equal(PREVIEW_DB.ssl.ca,undefined);assert.deepEqual(await previewSslOptions(),{...PREVIEW_DB.ssl});
});
test('missing or foreign provenance and incomplete approval fail before reading a file',async()=>{
 for(const delta of [{caSource:undefined},{caSource:'SUPABASE_DASHBOARD_vbdqvjvhjleqdadiiqjx'},{caSha256:undefined},{caFile:undefined}]){
  await assert.rejects(previewSslOptions({...options,...delta,readCertificate:async()=>{throw Error('MUST_NOT_READ');}}),/PREVIEW_PROVIDER_CA_APPROVAL_REQUIRED/);
 }
});
test('missing or changed CA fails closed without leaking file errors',async()=>{
 await assert.rejects(previewSslOptions({...options,readCertificate:async()=>{throw Error('PRIVATE-RAW-DETAIL');}}),/^Error: PREVIEW_PROVIDER_CA_FILE_UNAVAILABLE$/);
 await assert.rejects(previewSslOptions({...options,caSha256:'0'.repeat(64)}),/PREVIEW_PROVIDER_CA_HASH_MISMATCH/);
});
test('malformed certificate, extra roots, private keys and expired CA are rejected',async()=>{
 for(const value of ['not a certificate',pem+'\n'+pem,pem+'\n-----BEGIN PRIVATE KEY-----\nsynthetic\n-----END PRIVATE KEY-----']){
  const b=Buffer.from(value);await assert.rejects(previewSslOptions({...options,caSha256:createHash('sha256').update(b).digest('hex'),readCertificate:async()=>b}),/PREVIEW_PROVIDER_CA_INVALID/);
 }
 await assert.rejects(previewSslOptions({...options,now:Date.parse(cert.validTo)+1}),/PREVIEW_PROVIDER_CA_INVALID/);
 await assert.rejects(previewSslOptions({...options,now:Date.parse(cert.validFrom)-1}),/PREVIEW_PROVIDER_CA_INVALID/);
});
test('actual connection-only wrapper passes CA to pg and still verifies hostname and identity',async()=>{
 let config;const queries=[],output=[],errors=[];
 class Client{
  constructor(c){config=c;this.connectionParameters=c;this.connection={stream:{encrypted:true,authorized:true,getPeerCertificate:()=>({subjectaltname:`DNS:${PREVIEW_DB.host}`})}};}
  async connect(){}
  async end(){}
  async query(sql){queries.push(sql);return {rowCount:1,rows:[{db:'postgres',operator:'postgres',effective_operator:'postgres',ssl:true,pid:42}]};}
 }
 const sql=await readFile('docs/DCS-PREVIEW-DEMO-COMPATIBILITY-20261116.REVIEW.sql','utf8');
 const args=['--check-connection','apply',createHash('sha256').update(sql).digest('hex'),`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`];
 const deps={ClientClass:Client,password:'synthetic',loadSsl:()=>previewSslOptions(options),write:x=>output.push(JSON.parse(x)),writeError:x=>errors.push(JSON.parse(x))};
 assert.equal(await runPreviewSql(args,deps),0);assert.equal(config.ssl.ca,pem);
 assert.ok(queries.every(q=>q.startsWith('select ')));assert.equal(errors.length,0);
 assert.equal(output[0].state,'CONNECTION_VERIFIED_NO_SQL_APPLIED');
 const BadPeer=class extends Client{constructor(c){super(c);this.connection.stream.getPeerCertificate=()=>({subjectaltname:'DNS:wrong.invalid'});}};
 assert.equal(await runPreviewSql(args,{...deps,ClientClass:BadPeer}),1);
 assert.equal(errors.at(-1).category,'TLS_PEER_VERIFICATION_FAILED');
});
