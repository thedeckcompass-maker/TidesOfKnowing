import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applyPreviewSql,PREVIEW_DB,PREVIEW_REF} from './lib/lexicon-preview-sql.mjs';
const sql=await readFile('docs/DCS-PREVIEW-DEMO-COMPATIBILITY-20261116.REVIEW.sql','utf8');
const sha256=createHash('sha256').update(sql).digest('hex');
const approved={projectRef:PREVIEW_REF,authorization:`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`,sql,sha256};
function fixture({config={},identity={},tls={},pid=42,failDdl=false}={}){
 const queries=[];
 const client={connectionParameters:{...PREVIEW_DB,...config},connection:{stream:{encrypted:true,authorized:true,getPeerCertificate:()=>({subjectaltname:`DNS:${PREVIEW_DB.host}`}),...tls}},query:async text=>{
  queries.push(text);
  if(text.startsWith('select current_database'))return {rowCount:1,rows:[{db:'postgres',operator:'postgres',effective_operator:'postgres',ssl:true,pid:42,...identity}]};
  if(text==='select pg_backend_pid() pid')return {rows:[{pid}]};
  if(text.includes('CREATE SCHEMA')&&failDdl)throw Error('fixture DDL failure');
  return {rows:[]};
 }};
 return {client,queries};
}
test('production project, wrong host, missing approval and missing reviewed hash fail before database access',async()=>{
 for(const change of [{projectRef:'vbdqvjvhjleqdadiiqjx'},{authorization:''},{sha256:'invalid'}]){
  const f=fixture();await assert.rejects(applyPreviewSql(f.client,{...approved,...change}));assert.equal(f.queries.length,0);
 }
 for(const config of [{host:'db.vbdqvjvhjleqdadiiqjx.supabase.co'},{host:'localhost'},{database:'other'},{ssl:{rejectUnauthorized:false}}]){
  const f=fixture({config});await assert.rejects(applyPreviewSql(f.client,approved));assert.equal(f.queries.length,0);
 }
});
test('unverified TLS or wrong authenticated identity cannot run DDL',async()=>{
 for(const changes of [{tls:{authorized:false}},{tls:{getPeerCertificate:()=>({subjectaltname:'DNS:unexpected.supabase.co'})}},{identity:{db:'other'}},{identity:{operator:'other'}},{identity:{ssl:false}},{pid:99}]){
  const f=fixture(changes);await assert.rejects(applyPreviewSql(f.client,approved));assert.ok(!f.queries.some(q=>q.includes('CREATE SCHEMA')));
 }
});
test('verified session validates then rolls back; explicit commit and failure rollback are distinct',async()=>{
 const validation=fixture();const r=await applyPreviewSql(validation.client,approved);assert.equal(r.state,'VALIDATED_AND_ROLLED_BACK');assert.equal(validation.queries.at(-1),'ROLLBACK');
 assert.ok(validation.queries.findIndex(q=>q.startsWith('select current_database'))<validation.queries.findIndex(q=>q.includes('CREATE SCHEMA')));
 const commit=fixture();await applyPreviewSql(commit.client,{...approved,commit:true});assert.equal(commit.queries.at(-1),'COMMIT');
 const failure=fixture({failDdl:true});await assert.rejects(applyPreviewSql(failure.client,{...approved,commit:true}));assert.equal(failure.queries.at(-1),'ROLLBACK');assert.ok(!failure.queries.includes('COMMIT'));
});
test('dedicated Worker config has no production routes, resource inheritance, billing or service activation',async()=>{
 const c=JSON.parse(await readFile('wrangler.lexicon-preview.json','utf8'));
 assert.equal(c.name,'tidesofknowing-dcs-lexicon-preview');assert.notEqual(c.name,'tidesofknowing-consolidated');
 assert.equal(c.keep_vars,false);assert.equal(c.workers_dev,false);assert.equal(c.preview_urls,false);assert.deepEqual(c.routes,[]);assert.deepEqual(c.triggers.crons,[]);
 assert.equal(c.vars.PUBLIC_SUPABASE_URL,`https://${PREVIEW_REF}.supabase.co`);
 for(const key of ['STUDIO_RUNTIME_ENABLED','STUDIO_BILLING_TEST_ENABLED','STUDIO_BILLING_LIVE_ENABLED','STUDIO_BILLING_SCHEDULER_ENABLED'])assert.equal(c.vars[key],'false');
 for(const key of ['env','services','hyperdrive','r2_buckets','d1_databases','kv_namespaces','durable_objects','queues','ai'])assert.equal(c[key],undefined);
 assert.doesNotMatch(JSON.stringify(c),/vbdqvjvhjleqdadiiqjx|STRIPE|REALTIMEKIT|STREAM_/);
 const schema=JSON.parse(await readFile('node_modules/wrangler/config-schema.json','utf8'));
 assert.match(JSON.stringify(schema),/"preview_urls"/);
});
test('approved fixture hash and importer target guards are preserved',async()=>{
 const bytes=await readFile('scripts/fixtures/lexicon-demo-20261114.json');assert.equal(createHash('sha256').update(bytes).digest('hex'),'2ff2dc5965049fcb4f19093d83b060c947790b9dba75838dcc4b9452a57f7cac');
 const importer=await readFile('scripts/lib/lexicon-local-executor.mjs','utf8');assert.match(importer,/VERIFIED_PREVIEW_TLS_CONNECTION_REQUIRED/);assert.match(importer,/PREVIEW_SERVER_IDENTITY_REQUIRED/);
});
