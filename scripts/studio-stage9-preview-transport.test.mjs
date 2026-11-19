// Focused local-only acceptance. No hosted target or credentials are used.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';
import pg from 'pg';
import {runPreviewSql} from './apply-lexicon-preview-sql.mjs';
import {PREVIEW_DB,PREVIEW_REF} from './lib/lexicon-preview-sql.mjs';
const install=fs.readFileSync('docs/DCS-STAGE9-PREVIEW-TRANSPORT-20261117.REVIEW.sql','utf8');
const undo=fs.readFileSync('docs/DCS-STAGE9-PREVIEW-TRANSPORT-20261117.ROLLBACK.review.sql','utf8');
const sha=createHash('sha256').update(install).digest('hex');
const commit=s=>s.replace(/ROLLBACK;\s*$/,'COMMIT;');
function bundle(file){const m={exports:{}};new Function('module','exports','require',buildSync({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',define:{'import.meta.env':'{}'},logLevel:'silent'}).outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));return m.exports;}
const {composeDcsRuntime}=bundle('src/lib/studio/runtimeComposition.ts');

test('actual creator runtime and export composition do not call private providers when optional services are disabled',async()=>{
 let pgCalls=0,rpcCalls=0;
 const owner='11111111-1111-4111-8111-111111111111';
 const client={auth:{getUser:async()=>({data:{user:{id:owner}}})},rpc(){rpcCalls++;throw Error('Unexpected remote call');}};
 const locals={user:{id:owner},profile:{id:owner,status:'active'},supabase:client};
 const driver=()=>{pgCalls++;throw Error('Private driver must not run');};
 const off=await composeDcsRuntime(locals,undefined,driver);
 assert.equal(off.studioServiceRecords,null);assert.equal(off.studioExchangeProvider,null);
 const exports=await composeDcsRuntime(locals,{exports:true,services:false,exchange:false,artists:false,artistPortfolio:false},driver);
 assert.ok(exports.studioProjectSnapshotProvider);assert.ok(exports.studioExchangeSnapshotProvider);
 assert.equal(exports.studioServiceRecords,null);assert.equal(pgCalls,0);assert.equal(rpcCalls,0);
});

test('existing pinned wrapper accepts the new packet and rejects production, missing approval and wrong hash before DDL',async()=>{
 for(const change of [{host:'db.vbdqvjvhjleqdadiiqjx.supabase.co'},{approval:''},{hash:'0'.repeat(64)},{}]){
  const calls=[];let connected=0;const records=[];
  class MockClient{
   constructor(options){this.connectionParameters={...options,...(change.host?{host:change.host}:{})};this.connection={stream:{encrypted:true,authorized:true,getPeerCertificate:()=>({subjectaltname:`DNS:${PREVIEW_DB.host}`})}};}
   async connect(){connected++;} async end(){}
   async query(q){calls.push(q);if(q.startsWith('select current_database'))return {rowCount:1,rows:[{db:'postgres',operator:'postgres',effective_operator:'postgres',ssl:true,pid:17}]};if(q==='select pg_backend_pid() pid')return {rows:[{pid:17}]};return {rows:[]};}
  }
  const code=await runPreviewSql(['--validate','stage9-transport',change.hash??sha,change.approval??`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`],{ClientClass:MockClient,password:'synthetic-not-real',loadSsl:async()=>PREVIEW_DB.ssl,write:r=>records.push(r),writeError:r=>records.push(r)});
  if(Object.keys(change).length){assert.equal(code,1);assert.ok(!calls.includes(install));assert.ok(!calls.some(q=>q.includes('CREATE ROLE')));if(change.approval===''||change.hash)assert.equal(connected,0);}
  else {assert.equal(code,0);assert.ok(calls.some(q=>q.includes('CREATE ROLE')));assert.equal(calls.at(-1),'ROLLBACK');assert.match(records[0],/VALIDATED_AND_ROLLED_BACK/);}
  assert.ok(!records.join('').includes('synthetic-not-real'));
 }
});

test('real loopback PostgreSQL validates restricted roles, isolation, refusal and guarded rollback',async()=>{
 const bin='C:/Users/DELL 7410/Documents/Codex/2026-10-20/task/journey-spark-evidence/editorial-db-runtime/pgsql/bin';
 const parent=path.resolve('.build-temp');fs.mkdirSync(parent,{recursive:true});
 const root=fs.mkdtempSync(path.join(parent,'stage9-transport-test-')),data=path.join(root,'data');
 const env={SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR,PATH:bin+';'+process.env.SystemRoot+'\\System32',TEMP:process.env.TEMP,TMP:process.env.TMP};
 const exe=(name,args)=>{const r=spawnSync(path.join(bin,name+'.exe'),args,{env,windowsHide:true,encoding:'utf8',stdio:name==='pg_ctl'?'ignore':'pipe',timeout:45000});if(r.error||r.status!==0)throw Error('LOCAL_'+name+'_FAILED');};
 const server=net.createServer();await new Promise((r,j)=>{server.on('error',j);server.listen(0,'127.0.0.1',r);});const port=server.address().port;await new Promise(r=>server.close(r));
 let started=false,c;
 try{
  exe('initdb',['-D',data,'-U','postgres','-A','trust','--no-locale']);
  exe('pg_ctl',['-D',data,'-l',path.join(root,'server.log'),'-o',`-h 127.0.0.1 -p ${port}`,'-w','start']);started=true;
  c=new pg.Client({host:'127.0.0.1',port,user:'postgres',database:'postgres',connectionTimeoutMillis:5000});await c.connect();
  await c.query(`CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE SCHEMA studio_private;
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   CREATE TABLE public.studio_projects(id uuid PRIMARY KEY,owner_id uuid NOT NULL,title text);
   ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;
   CREATE POLICY owner_only ON public.studio_projects TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
   GRANT USAGE ON SCHEMA public,auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
   GRANT SELECT,UPDATE ON public.studio_projects TO authenticated;
   INSERT INTO public.studio_projects VALUES('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','preserve owner'),('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','preserve foreign');
   CREATE TABLE studio_private.preserved_service_fixture(owner_id uuid PRIMARY KEY,body jsonb NOT NULL);
   ALTER TABLE studio_private.preserved_service_fixture ENABLE ROW LEVEL SECURITY;
   INSERT INTO studio_private.preserved_service_fixture VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"synthetic":true}');
   CREATE FUNCTION studio_private.denied_dispatch_v1() RETURNS int LANGUAGE sql AS $$SELECT 1$$;
   REVOKE ALL ON FUNCTION studio_private.denied_dispatch_v1() FROM PUBLIC;`);
  const before=(await c.query('SELECT * FROM studio_projects ORDER BY id')).rows;
  await c.query('GRANT SELECT ON public.studio_projects TO PUBLIC');
  await assert.rejects(c.query(commit(install)),/Unexpected inherited creator-data privileges/);await c.query('ROLLBACK');
  assert.equal((await c.query("SELECT count(*)::int n FROM pg_roles WHERE rolname LIKE 'dcs_%'")).rows[0].n,0);
  await c.query('REVOKE SELECT ON public.studio_projects FROM PUBLIC');
  await c.query(install);assert.equal((await c.query("SELECT count(*)::int n FROM pg_roles WHERE rolname LIKE 'dcs_%'")).rows[0].n,0);
  await c.query(commit(install));
  const roles=(await c.query("SELECT rolname,rolcanlogin,rolsuper,rolinherit,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolname LIKE 'dcs_%' ORDER BY rolname")).rows;
  assert.equal(roles.length,2);for(const r of roles){assert.equal(r.rolcanlogin,r.rolname==='dcs_exchange_connection');for(const k of ['rolsuper','rolinherit','rolcreatedb','rolcreaterole','rolreplication','rolbypassrls'])assert.equal(r[k],false);}
  assert.deepEqual((await c.query("SELECT admin_option,inherit_option,set_option FROM pg_auth_members WHERE member='dcs_exchange_connection'::regrole AND roleid='dcs_service_executor'::regrole")).rows,[{admin_option:false,inherit_option:false,set_option:true}]);
  await assert.rejects(c.query(commit(install)),/Existing role/);await c.query('ROLLBACK');
  for(const role of ['dcs_exchange_connection','dcs_service_executor']){
   for(const statement of ['SELECT * FROM public.studio_projects','SELECT * FROM studio_private.preserved_service_fixture','SELECT studio_private.denied_dispatch_v1()','SET ROLE authenticated','CREATE ROLE forbidden_role']){
    await c.query(`SET SESSION AUTHORIZATION ${role}`);await c.query('BEGIN');await assert.rejects(c.query(statement),undefined,role+': '+statement);await c.query('ROLLBACK');await c.query('RESET SESSION AUTHORIZATION');
   }
  }
  await c.query('BEGIN');await c.query('SET SESSION AUTHORIZATION dcs_exchange_connection');await c.query('SET LOCAL ROLE dcs_service_executor');assert.equal((await c.query('SELECT current_user role')).rows[0].role,'dcs_service_executor');await c.query('ROLLBACK');await c.query('RESET SESSION AUTHORIZATION');
  for(const owner of ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']){
   await c.query('BEGIN');await c.query('SET LOCAL ROLE authenticated');await c.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[owner]);const rows=(await c.query('SELECT * FROM studio_projects')).rows;assert.equal(rows.length,1);assert.equal(rows[0].owner_id,owner);assert.equal((await c.query('UPDATE studio_projects SET title=title WHERE owner_id<>$1 RETURNING id',[owner])).rowCount,0);await c.query('ROLLBACK');
  }
  // Added dependencies must block reversal atomically; no DROP OWNED/CASCADE.
  await c.query('GRANT SELECT ON studio_private.preserved_service_fixture TO dcs_service_executor');
  await assert.rejects(c.query(commit(undo)));await c.query('ROLLBACK');
  assert.equal((await c.query("SELECT count(*)::int n FROM pg_roles WHERE rolname LIKE 'dcs_%'")).rows[0].n,2);
  await c.query('REVOKE SELECT ON studio_private.preserved_service_fixture FROM dcs_service_executor');
  await c.query(undo);assert.equal((await c.query("SELECT count(*)::int n FROM pg_roles WHERE rolname LIKE 'dcs_%'")).rows[0].n,2);
  await c.query(commit(undo));assert.equal((await c.query("SELECT count(*)::int n FROM pg_roles WHERE rolname LIKE 'dcs_%'")).rows[0].n,0);
  assert.deepEqual((await c.query('SELECT * FROM studio_projects ORDER BY id')).rows,before);
  assert.equal((await c.query('SELECT count(*)::int n FROM studio_private.preserved_service_fixture')).rows[0].n,1);
 }finally{
  if(c)await c.end();
  if(started){exe('pg_ctl',['-D',data,'-m','fast','-w','stop']);started=false;}
  if(fs.existsSync(path.join(data,'postmaster.pid')))throw Error('LOCAL_TEST_STILL_RUNNING_RESOURCES_PRESERVED');
  if(path.dirname(fs.realpathSync(root))!==fs.realpathSync(parent)||!path.basename(root).startsWith('stage9-transport-test-'))throw Error('UNSAFE_TEST_CLEANUP');
  fs.rmSync(root,{recursive:true,force:true});
 }
});
