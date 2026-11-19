import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runPreviewSql} from './apply-lexicon-preview-sql.mjs';
import {PREVIEW_DB,PREVIEW_REF,safePreviewFailure} from './lib/lexicon-preview-sql.mjs';

const sql=await readFile('docs/DCS-PREVIEW-DEMO-COMPATIBILITY-20261116.REVIEW.sql','utf8');
const hash=createHash('sha256').update(sql).digest('hex');
const approval=`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`;
const secret='SYNTHETIC-SECRET-MUST-NOT-APPEAR';
const error=code=>Object.assign(new Error(secret),{code,detail:secret,hint:secret,stack:secret});

async function run({mode='--check-connection',connectError,queryError,tls={},identity={},args,rollbackError=false}={}){
 const queries=[],output=[],diagnostics=[];
 let connections=0,closed=false;
 class FixtureClient{
  constructor(config){this.connectionParameters=config;this.connection={stream:{encrypted:true,authorized:true,getPeerCertificate:()=>({subjectaltname:`DNS:${PREVIEW_DB.host}`}),...tls}};}
  async connect(){connections++;if(connectError)throw connectError;}
  async end(){closed=true;}
  async query(text){
   queries.push(text);
   if(text.startsWith('select current_database'))return {rowCount:1,rows:[{db:'postgres',operator:'postgres',effective_operator:'postgres',ssl:true,pid:123,...identity}]};
   if(text==='select pg_backend_pid() pid')return {rows:[{pid:123}]};
   if(text.includes('CREATE SCHEMA')&&queryError)throw queryError;
   if(text==='ROLLBACK'&&rollbackError)throw error('ECONNRESET');
   return {rows:[]};
  }
 }
 const exit=await runPreviewSql(args??[mode,'apply',hash,approval],{
  ClientClass:FixtureClient,password:secret,readSql:async()=>sql,
  write:text=>output.push(JSON.parse(text)),writeError:text=>diagnostics.push(JSON.parse(text))
 });
 assert.doesNotMatch(JSON.stringify({output,diagnostics}),new RegExp(secret));
 return {exit,queries,output,diagnostics,connections,closed};
}

test('connection-only mode verifies the actual driver contract with SELECTs only',async()=>{
 const r=await run();assert.equal(r.exit,0);assert.equal(r.connections,1);assert.equal(r.closed,true);
 assert.equal(r.output[0].state,'CONNECTION_VERIFIED_NO_SQL_APPLIED');
 assert.ok(r.queries.length>0);assert.ok(r.queries.every(q=>q.startsWith('select ')));
 assert.ok(!r.queries.some(q=>/BEGIN|COMMIT|ROLLBACK|CREATE|ALTER|INSERT|UPDATE|DELETE/.test(q)));
});

for(const [code,category] of [
 ['28P01','DATABASE_AUTHENTICATION_FAILED'],['28000','DATABASE_AUTHORIZATION_FAILED'],
 ['ENOTFOUND','DATABASE_DNS_FAILURE'],['ECONNREFUSED','DATABASE_CONNECTION_REFUSED'],
 ['ETIMEDOUT','DATABASE_CONNECTION_TIMEOUT'],['ENETUNREACH','DATABASE_NETWORK_UNREACHABLE'],
 ['ERR_TLS_CERT_ALTNAME_INVALID','TLS_HOSTNAME_MISMATCH'],
 ['SELF_SIGNED_CERT_IN_CHAIN','TLS_CERTIFICATE_CHAIN_UNTRUSTED'],
 ['UNABLE_TO_VERIFY_LEAF_SIGNATURE','TLS_CERTIFICATE_CHAIN_UNTRUSTED'],
 ['CERT_HAS_EXPIRED','TLS_CERTIFICATE_EXPIRED']
])test(`safe connection classification: ${code}`,async()=>{
 const r=await run({connectError:error(code)});assert.equal(r.exit,1);assert.equal(r.output.length,0);
 assert.deepEqual(r.diagnostics[0],{projectRef:PREVIEW_REF,state:'STOP',stage:'CONNECT',category});
 assert.equal(r.queries.length,0);assert.equal(r.closed,true);
});

test('TLS-peer and database identity failures cannot enter the SQL transaction',async()=>{
 for(const [changes,category] of [
  [{tls:{authorized:false}},'TLS_PEER_VERIFICATION_FAILED'],
  [{identity:{db:'wrong'}},'DATABASE_IDENTITY_REJECTED'],
  [{identity:{effective_operator:'wrong'}},'DATABASE_IDENTITY_REJECTED']
 ]){
  const r=await run({mode:'--validate',...changes});assert.equal(r.exit,1);
  assert.equal(r.diagnostics[0].category,category);assert.ok(!r.queries.includes('BEGIN'));
 }
});

test('approval, hash and local file failures are distinguished before connecting',async()=>{
 for(const [args,category] of [
  [['--validate','apply',hash,''],'LOCAL_INPUT_REQUIRED'],
  [['--validate','apply','wrong',approval],'REVIEWED_SQL_HASH_MISMATCH']
 ]){
  const r=await run({args});assert.equal(r.exit,1);assert.equal(r.connections,0);
  assert.equal(r.diagnostics[0].category,category);
 }
 const diagnostics=[];
 const exit=await runPreviewSql(['--validate','apply',hash,approval],{password:secret,
  readSql:async()=>{throw error('ENOENT');},writeError:text=>diagnostics.push(JSON.parse(text))});
 assert.equal(exit,1);assert.equal(diagnostics[0].category,'LOCAL_SQL_FILE_UNAVAILABLE');
});

for(const [code,category] of [
 ['42501','DATABASE_PERMISSION_DENIED'],['42P01','SQL_REQUIRED_RELATION_MISSING'],
 ['42703','SQL_REQUIRED_COLUMN_MISSING'],['42883','SQL_REQUIRED_FUNCTION_MISSING'],
 ['42P06','SQL_EXISTING_SCHEMA_CONFLICT'],['42710','SQL_EXISTING_OBJECT_CONFLICT'],
 ['42601','SQL_SYNTAX_FAILURE'],['55P03','DATABASE_LOCK_UNAVAILABLE']
])test(`safe SQL application classification: ${code}`,async()=>{
 const r=await run({mode:'--validate',queryError:error(code)});
 assert.equal(r.exit,1);assert.equal(r.diagnostics[0].category,category);
 assert.equal(r.diagnostics[0].stage,'SQL_APPLY');assert.equal(r.output.length,0);
 assert.equal(r.queries.at(-1),'ROLLBACK');assert.ok(!r.queries.includes('COMMIT'));
});

test('failed rollback preserves the original diagnostic without raw errors',async()=>{
 const r=await run({mode:'--validate',queryError:error('42501'),rollbackError:true});
 assert.equal(r.diagnostics[0].category,'DATABASE_PERMISSION_DENIED');assert.equal(r.exit,1);
});

test('successful validation rolls back and unknown provider errors stay redacted',async()=>{
 const r=await run({mode:'--validate'});assert.equal(r.exit,0);
 assert.equal(r.queries.at(-1),'ROLLBACK');assert.ok(!r.queries.includes('COMMIT'));
 assert.equal(r.output[0].state,'VALIDATED_AND_ROLLED_BACK');
 const unknown=safePreviewFailure(error(secret),'CONNECT');
 assert.deepEqual(unknown,{projectRef:PREVIEW_REF,state:'STOP',stage:'CONNECT',category:'DATABASE_CONNECTION_FAILURE_UNCLASSIFIED'});
 assert.doesNotMatch(JSON.stringify(unknown),new RegExp(secret));
});
