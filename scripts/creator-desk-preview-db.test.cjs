'use strict';
// Disposable loopback PostgreSQL only. Never connects to a hosted project.
const {spawnSync,spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net'),assert=require('node:assert/strict');
const bin='C:\\Users\\DELL 7410\\Documents\\Codex\\2026-10-20\\task\\journey-spark-evidence\\editorial-db-runtime\\pgsql\\bin';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'dcs-explore-test-'));
const db=path.join(root,'db'); let started=false;
function run(exe,args,opts={}) {const p=spawnSync(path.join(bin,exe),args,{...opts,encoding:'utf8',windowsHide:true,timeout:60000});if(p.error||p.status!==0)throw Error(exe+': '+(p.error||p.stderr||p.status));return p.stdout;}
async function main(){
 const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 const env={SystemRoot:process.env.SystemRoot,PATH:bin+';'+process.env.SystemRoot+'\\System32',PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:'fixture',PGDATABASE:'postgres'};
 const sql=s=>run('psql.exe',['-X','-t','-A','-v','ON_ERROR_STOP=1','-c',s],{env});
 try {
  run('initdb.exe',['-D',db,'-U','fixture','-A','trust','--no-locale'],{env});
  const start=spawnSync(path.join(bin,'pg_ctl.exe'),['-D',db,'-l',path.join(root,'server.log'),'-o','-h 127.0.0.1 -p '+port,'-w','start'],{env,stdio:'ignore',windowsHide:true,timeout:30000});if(start.status!==0)throw Error('fixture startup failed');started=true;

  sql("create role anon; create role authenticated; create schema auth; create table public.profiles(id uuid primary key,status text); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create schema dcs_demo; create table dcs_demo.environment(singleton boolean,project_ref text);insert into dcs_demo.environment values(true,'utzcmbidotxgmulguzxo'); create table dcs_demo.preview_owners(owner_id uuid,project_id uuid); create table public.studio_projects(id uuid primary key,owner_id uuid,settings jsonb default '{}',updated_at timestamptz default now(),deleted_at timestamptz,status text default 'writing'); create function dcs_demo.can_access(target uuid,writing boolean) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.studio_projects p join public.profiles u on u.id=p.owner_id where p.id=target and p.owner_id=auth.uid() and u.status='active')$$; create function public.studio_project_can_edit_v1(target uuid) returns boolean language sql stable security definer as $$select dcs_demo.can_access(target,true)$$;");
  const delta=fs.readFileSync(path.join(__dirname,'../docs/DCS-PREVIEW-CREATOR-DESK-20261117.REVIEW.sql'),'utf8').replace(/ROLLBACK;\s*$/,'COMMIT;');sql(delta);
  const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',project='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',foreign='cccccccc-cccc-4ccc-8ccc-cccccccccccc',capture='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  sql("insert into profiles values('"+owner+"','active'),('"+foreign+"','active');insert into studio_projects(id,owner_id) values('"+project+"','"+owner+"');insert into dcs_demo.preview_owners values('"+owner+"','"+project+"');grant usage on schema auth,dcs_demo to authenticated;");
  const actor="select set_config('request.jwt.claim.sub','"+owner+"',false);set role authenticated;";
  sql(actor+"select studio_creator_inspiration_save_v1('"+capture+"','Synthetic private idea',null);");
  sql(actor+"select studio_creator_inspiration_save_v1('"+capture+"','Synthetic private idea',null);");
  assert.equal(sql("select jsonb_array_length(inbox->'entries') from studio_creator_inspiration where owner_id='"+owner+"'").trim(),'1');
  sql(actor+"select studio_explore_inspiration_link_v1('"+capture+"','"+project+"');");
  assert.equal(sql("select jsonb_array_length(settings->'creative_inbox_v1'->'entries') from studio_projects where id='"+project+"'").trim(),'1');
  assert.throws(()=>sql(actor+"select studio_creator_inspiration_save_v1('"+capture+"','Conflicting payload',null);"));
  assert.equal(sql("select set_config('request.jwt.claim.sub','"+foreign+"',false);set role authenticated;select count(*) from studio_creator_inspiration").trim().split(/\s+/).at(-1),'0');
  assert.throws(()=>sql("select set_config('request.jwt.claim.sub','"+foreign+"',false);set role authenticated;select studio_explore_inspiration_link_v1('"+capture+"','"+project+"');"));
  const undo=fs.readFileSync(path.join(__dirname,'../docs/DCS-PREVIEW-CREATOR-DESK-20261117.ROLLBACK.review.sql'),'utf8').replace(/ROLLBACK;\s*$/,'COMMIT;');assert.throws(()=>sql(undo));
  console.log('PASS: review-only Desk SQL creates persistence, preserves idempotency, links atomically, enforces owner RLS and refuses populated rollback');
 } finally {if(started){run('pg_ctl.exe',['-D',db,'-m','fast','-w','stop'],{env});started=false;}if(fs.existsSync(path.join(db,'postmaster.pid')))throw Error('Fixture still running; preserved: '+root);if(path.dirname(fs.realpathSync(root)).toLowerCase()!==fs.realpathSync(os.tmpdir()).toLowerCase()||!path.basename(root).startsWith('dcs-explore-test-'))throw Error('Unsafe fixture path');fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1});
