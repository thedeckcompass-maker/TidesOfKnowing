'use strict';
// Run the existing isolated bootstrap with new synthetic boundary scenarios.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const original=fs.readFileSync(path.join(__dirname,'studio-explore-capacity-db.test.cjs'),'utf8');
const start=original.indexOf('  const owner='),end=original.indexOf("  console.log('PASS:");
if(start<0||end<=start)throw Error('FIXTURE_BOOTSTRAP_CHANGED');
const scenarios=String.raw`
  sql("create role anon; alter table public.studio_projects add constraint fixture_project_owner_unique unique(id,owner_id); create or replace function studio_private.has_access() returns boolean language sql stable security definer set search_path=pg_catalog,public as $$ select exists(select 1 from public.studio_access a join public.profiles p on p.id=a.user_id where a.user_id=auth.uid() and p.status='active' and a.revoked_at is null and a.starts_at<=now() and a.expires_at>now()) $$; create function studio_private.owner_download_grace_v1() returns boolean language sql stable as $$ select false $$; create function public.studio_owns_project(target uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$ select exists(select 1 from public.studio_projects p where p.id=target and p.owner_id=auth.uid()) $$; grant execute on function public.studio_owns_project(uuid) to authenticated; alter table studio_card_versions add column project_id uuid; create table studio_guidebook_versions(project_id uuid); create table studio_import_records(project_id uuid); create table studio_production_plan_versions(project_id uuid);");
  sql('create policy "Studio entitlement required for reading" on studio_projects as restrictive for select using(true); create policy "Manual Studio journal media read" on storage.objects as restrictive for select using(true);');
  sql("create table studio_editorial_requests(id uuid,owner_id uuid,project_id uuid,recipient_id uuid); alter table studio_editorial_requests enable row level security; create function studio_private.editorial_actor_active_v1() returns boolean language sql stable as $$ select auth.uid() is not null $$; create function studio_private.editorial_owner_read_v1(p_owner uuid) returns boolean language sql stable as $$ select p_owner=auth.uid() and (studio_private.has_access() or studio_private.owner_download_grace_v1()) $$; create function studio_private.editorial_staff_v1(p_recipient uuid) returns boolean language sql stable as $$ select false $$; create function studio_private.editorial_history_access_v1(p_project uuid,p_allow_expired boolean) returns boolean language sql stable as $$ select false $$; create policy \"Owner or assigned editorial recipient only\" on studio_editorial_requests for select to authenticated using (studio_private.editorial_actor_active_v1() and (studio_private.editorial_owner_read_v1(owner_id) or studio_private.editorial_staff_v1(recipient_id))); grant select on studio_editorial_requests to authenticated; grant execute on function studio_private.editorial_actor_active_v1(),studio_private.editorial_owner_read_v1(uuid),studio_private.editorial_staff_v1(uuid),studio_private.editorial_history_access_v1(uuid,boolean) to authenticated;");
  for(const table of ['studio_card_families','studio_cards','studio_card_versions','studio_guidebook_sections','studio_guidebook_versions','studio_import_records','studio_journal_entries','studio_journal_excerpts','studio_journal_photos','studio_production_plans','studio_production_plan_versions']){
   const prefix=table.startsWith('studio_journal_')||table.startsWith('studio_production_')?'Manual Studio access required ':'Studio entitlement required ';
   sql('alter table '+table+' enable row level security; create policy "'+prefix+'read" on '+table+' as restrictive for select using(true);');
  }
  sql('create policy "Creators can read own production plan" on studio_production_plans for select using(true); create policy "Creators can read own production plan history" on studio_production_plan_versions for select using(true);');
  const owner='00000000-0000-0000-0000-000000000071',foreign='00000000-0000-0000-0000-000000000072',unknown='00000000-0000-0000-0000-000000000073',old='10000000-0000-0000-0000-000000000071',free='10000000-0000-0000-0000-000000000072',unknownOld='10000000-0000-0000-0000-000000000075',unknownFree='10000000-0000-0000-0000-000000000076',small='10000000-0000-0000-0000-000000000081';
  const card=i=>'20000000-0000-0000-0000-'+String(i).padStart(12,'0');
  sql("insert into profiles values('"+owner+"','member','active'),('"+foreign+"','member','active'),('"+unknown+"','member','active'); insert into studio_access values('"+owner+"',now()-interval '30 days',now()+interval '1 day',null),('"+unknown+"',now()-interval '30 days',now()+interval '1 day',null); insert into studio_projects(id,owner_id,settings) values('"+old+"','"+owner+"','{\"work\":\"retained\"}'),('"+small+"','"+owner+"','{\"work\":\"small retained\"}'),('"+unknownOld+"','"+unknown+"','{\"work\":\"unknown provenance\"}'); delete from studio_access where user_id='"+unknown+"';");
  for(let i=1;i<=11;i++)sql("insert into studio_cards(id,project_id,title) values('"+card(i)+"','"+old+"','retained');");
  for(let i=51;i<=60;i++)sql("insert into studio_cards(id,project_id,title) values('"+card(i)+"','"+small+"','small retained');");
  sql("update studio_access set expires_at=now()-interval '1 day' where user_id='"+owner+"';");
  const candidate=fs.readFileSync(path.join(__dirname,'../docs/STUDIO-PROJECT-ENTITLEMENT-BOUNDARY-20261116.REVIEW.sql'),'utf8').replace(/ROLLBACK;\s*$/,'COMMIT;');sql(candidate);
  const rollback=fs.readFileSync(path.join(__dirname,'../docs/STUDIO-PROJECT-ENTITLEMENT-BOUNDARY-20261116.ROLLBACK.review.sql'),'utf8').replace(/ROLLBACK;\s*$/,'COMMIT;');
  sql(rollback);sql(candidate); // Empty-binding rollback is reversible in the disposable fixture.
  const conversion=fs.readFileSync(path.join(__dirname,'../docs/STUDIO-EXPLORE-CONVERSION-20261116.REVIEW.sql'),'utf8').replace(/ROLLBACK;\s*$/,'COMMIT;');sql(conversion);
  assert.match(sql("select has_function_privilege('authenticated','studio_private.review_convert_to_explore_v1(uuid)','execute')"),/\bf\b/);
  assert.throws(()=>sql("set request.jwt.claim.sub='"+owner+"'; select studio_private.review_convert_to_explore_v1('"+old+"');"),/STUDIO_EXPLORE_CARD_CAPACITY/);
  sql("begin; set request.jwt.claim.sub='"+owner+"'; select studio_private.review_convert_to_explore_v1('"+small+"'); rollback;");
  assert.match(sql("select count(*) from studio_private.explore_project_bindings_v1 where project_id='"+small+"'"),/\b0\b/);
  assert.match(sql("select count(*) from studio_cards where project_id='"+small+"'"),/\b10\b/);
  assert.match(sql("select settings->>'work' from studio_projects where id='"+small+"'"),/small retained/);
  const unknownActor="set role authenticated; set request.jwt.claim.sub='"+unknown+"'; ";
  assert.match(sql(unknownActor+"select count(*) from studio_projects where id='"+unknownOld+"'"),/\b0\b/);
  sql(unknownActor+"insert into studio_projects(id,owner_id) values('"+unknownFree+"','"+unknown+"');");
  assert.match(sql(unknownActor+"select studio_project_can_edit_v1('"+unknownFree+"')"),/\bt\b/);
  assert.match(sql("select settings->>'work' from studio_projects where id='"+unknownOld+"'"),/unknown provenance/);
  const actor="set role authenticated; set request.jwt.claim.sub='"+owner+"'; ";
  assert.match(sql(actor+"select count(*) from studio_projects where id='"+old+"'"),/\b1\b/);
  assert.match(sql(actor+"select studio_project_can_read_v1('"+old+"')"),/\bt\b/);
  sql(actor+"update studio_projects set settings='{\"work\":\"changed\"}' where id='"+old+"';");
  sql(actor+"update studio_cards set title='changed' where id='"+card(1)+"';");
  assert.throws(()=>sql("set request.jwt.claim.sub='"+owner+"'; insert into studio_guidebook_sections(project_id) values('"+old+"');"),/STUDIO_PROJECT_BINDING_REQUIRED/);
  assert.match(sql("select settings->>'work' from studio_projects where id='"+old+"'"),/retained/);
  assert.match(sql("select title from studio_cards where id='"+card(1)+"'"),/retained/);
  assert.match(sql(actor+"select studio_project_can_edit_v1('"+old+"')"),/\bf\b/);
  sql(actor+"insert into studio_projects(id,owner_id) values('"+free+"','"+owner+"');");
  assert.throws(()=>sql("set request.jwt.claim.sub='"+owner+"'; select studio_private.review_convert_to_explore_v1('"+small+"');"),/STUDIO_EXPLORE_PROJECT_CAPACITY/);
  sql("set request.jwt.claim.sub='"+owner+"'; insert into studio_guidebook_sections(project_id) values('"+free+"');");
  sql("insert into studio_editorial_requests values('30000000-0000-0000-0000-000000000071','"+owner+"','"+old+"',null),('30000000-0000-0000-0000-000000000072','"+owner+"','"+free+"',null);");
  assert.throws(()=>sql(rollback),/Rollback stopped: preserve or reconcile Explore project bindings first/);
  assert.match(sql(actor+"select studio_project_can_edit_v1('"+free+"')"),/\bt\b/);
  for(let i=12;i<=21;i++)sql(actor+"insert into studio_cards(id,project_id,title) values('"+card(i)+"','"+free+"','free');");
  assert.throws(()=>sql(actor+"insert into studio_cards(id,project_id,title) values('"+card(22)+"','"+free+"','free')"),/STUDIO_EXPLORE_CARD_CAPACITY/);
  assert.throws(()=>sql(actor+"insert into studio_projects(id,owner_id) values('10000000-0000-0000-0000-000000000073','"+owner+"')"),/STUDIO_EXPLORE_PROJECT_CAPACITY/);
  assert.throws(()=>sql(actor+'select * from studio_private.explore_project_bindings_v1'),/permission denied/);
  assert.throws(()=>sql(actor+"insert into studio_private.explore_project_bindings_v1(project_id,owner_id) values('"+old+"','"+owner+"')"),/permission denied/);
  assert.match(sql("set role authenticated; set request.jwt.claim.sub='"+foreign+"'; select studio_project_can_edit_v1('"+free+"')"),/\bf\b/);
  assert.match(sql("set role authenticated; set request.jwt.claim.sub='"+foreign+"'; select studio_project_can_read_v1('"+old+"')"),/\bf\b/);
  assert.match(sql("begin; update studio_access set expires_at=now() where user_id='"+owner+"'; "+actor+"select studio_project_can_read_v1('"+old+"'); rollback;"),/\bt\b/);
  assert.match(sql("begin; update studio_access set expires_at=now()-interval '28 days'+interval '1 microsecond' where user_id='"+owner+"'; "+actor+"select studio_project_can_read_v1('"+old+"'); rollback;"),/\bt\b/);
  assert.match(sql("begin; update studio_access set expires_at=now()-interval '28 days' where user_id='"+owner+"'; "+actor+"select studio_project_can_read_v1('"+old+"'); rollback;"),/\bf\b/);
  sql(actor+"update studio_cards set deleted_at=now() where id='"+card(12)+"';");
  const {Client}=require('pg'),cfg={host:'127.0.0.1',port,user:'fixture',database:'postgres'},a=new Client(cfg),b=new Client(cfg);
  await Promise.all([a.connect(),b.connect()]);
  try{
   await Promise.all([a.query(actor),b.query(actor)]);
   const results=await Promise.allSettled([a.query("insert into studio_cards(id,project_id,title) values('"+card(22)+"','"+free+"','a')"),b.query("insert into studio_cards(id,project_id,title) values('"+card(23)+"','"+free+"','b')")]);
   assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.match(String(results.find(x=>x.status==='rejected').reason),/STUDIO_EXPLORE_CARD_CAPACITY/);
   assert.equal((await a.query("select count(*)::int as n from studio_cards where project_id='"+free+"' and deleted_at is null")).rows[0].n,10);
  }finally{await Promise.all([a.end(),b.end()]);}
  assert.throws(()=>sql(actor+"update studio_cards set deleted_at=null where id='"+card(12)+"'"),/STUDIO_EXPLORE_CARD_CAPACITY/);
  sql(actor+"update studio_cards set deleted_at=now() where id='"+card(13)+"'; update studio_cards set deleted_at=null where id='"+card(12)+"';");
  sql("update studio_access set expires_at=now()-interval '28 days' where user_id='"+owner+"';");
  assert.match(sql(actor+"select count(*) from studio_projects where id='"+old+"'"),/\b0\b/);
  assert.match(sql(actor+"select studio_project_can_read_v1('"+old+"')"),/\bf\b/);
  assert.match(sql(actor+"select count(*) from studio_projects where id='"+free+"'"),/\b1\b/);
  assert.match(sql(actor+"select studio_project_can_read_v1('"+free+"')"),/\bt\b/);
  assert.match(sql(actor+"select count(*) from studio_editorial_requests where project_id='"+old+"'"),/\b0\b/);
  assert.match(sql(actor+"select count(*) from studio_editorial_requests where project_id='"+free+"'"),/\b1\b/);
  assert.match(sql(actor+"select studio_private.editorial_history_access_v1('"+free+"',false)"),/\bf\b/);
  assert.match(sql(actor+"select studio_private.editorial_history_access_v1('"+free+"',true)"),/\bt\b/);
  assert.match(sql("select count(*) from studio_cards where project_id='"+old+"'"),/\b11\b/);
  sql("update studio_access set expires_at=now()+interval '1 day' where user_id='"+owner+"';");
  assert.match(sql(actor+"select studio_project_can_edit_v1('"+old+"')"),/\bt\b/);
  sql(actor+"update studio_cards set title='paid edit' where id='"+card(1)+"';");
  assert.match(sql("select title from studio_cards where id='"+card(1)+"'"),/paid edit/);
  assert.match(sql("select count(*) from studio_private.explore_project_bindings_v1 where project_id='"+old+"'"),/\b0\b/);
  sql("update studio_access set revoked_at=now() where user_id='"+owner+"';");
  assert.match(sql(actor+"select studio_project_can_read_v1('"+old+"')"),/\bf\b/);
  assert.match(sql(actor+"select studio_project_can_read_v1('"+free+"')"),/\bt\b/);
  // Two formerly free projects can be active during paid access; expiry must
  // not silently grant two free workspaces or delete either project.
  sql(actor+"update studio_projects set deleted_at=now() where id='"+free+"';");
  const second='10000000-0000-0000-0000-000000000074';
  sql(actor+"insert into studio_projects(id,owner_id) values('"+second+"','"+owner+"');");
  assert.throws(()=>sql(actor+"update studio_projects set deleted_at=null where id='"+free+"'"),/STUDIO_EXPLORE_PROJECT_CAPACITY/);
  sql("update studio_access set revoked_at=null,expires_at=now()+interval '1 day' where user_id='"+owner+"';");
  sql(actor+"update studio_projects set deleted_at=null where id='"+free+"';");
  sql("update studio_access set expires_at=now()-interval '1 day' where user_id='"+owner+"';");
  assert.match(sql(actor+"select studio_project_can_edit_v1('"+free+"')"),/\bf\b/);
  assert.match(sql(actor+"select studio_project_can_edit_v1('"+second+"')"),/\bt\b/);
  assert.match(sql("select count(*) from studio_projects where id in ('"+free+"','"+second+"') and deleted_at is null"),/\b2\b/);
  // A previously free project can grow past ten while paid. On expiry it is
  // retained as paid work and must not prevent a separate Explore project.
  const expandedOwner='00000000-0000-0000-0000-000000000074',expanded='10000000-0000-0000-0000-000000000077',replacement='10000000-0000-0000-0000-000000000078';
  const expandedActor="set role authenticated; set request.jwt.claim.sub='"+expandedOwner+"'; ";
  sql("insert into profiles values('"+expandedOwner+"','member','active');");
  sql(expandedActor+"insert into studio_projects(id,owner_id) values('"+expanded+"','"+expandedOwner+"');");
  for(let i=31;i<=40;i++)sql(expandedActor+"insert into studio_cards(id,project_id,title) values('"+card(i)+"','"+expanded+"','retained free work');");
  sql("insert into studio_access values('"+expandedOwner+"',now()-interval '1 day',now()+interval '1 day',null);");
  sql(expandedActor+"insert into studio_cards(id,project_id,title) values('"+card(41)+"','"+expanded+"','paid addition');");
  sql("update studio_access set expires_at=now()-interval '1 hour' where user_id='"+expandedOwner+"';");
  assert.match(sql(expandedActor+"select studio_project_can_edit_v1('"+expanded+"')"),/\bf\b/);
  sql(expandedActor+"insert into studio_projects(id,owner_id) values('"+replacement+"','"+expandedOwner+"');");
  assert.match(sql(expandedActor+"select studio_project_can_edit_v1('"+replacement+"')"),/\bt\b/);
  assert.match(sql("select count(*) from studio_cards where project_id='"+expanded+"' and deleted_at is null"),/\b11\b/);
  // Even under ten cards, a paid Guidebook write must not silently revert to
  // free Explore access after expiry.
  const writer='00000000-0000-0000-0000-000000000075',written='10000000-0000-0000-0000-000000000079',fresh='10000000-0000-0000-0000-000000000080';
  const writerActor="set role authenticated; set request.jwt.claim.sub='"+writer+"'; ";
  sql("insert into profiles values('"+writer+"','member','active');");
  sql(writerActor+"insert into studio_projects(id,owner_id) values('"+written+"','"+writer+"');");
  sql("insert into studio_access values('"+writer+"',now()-interval '1 day',now()+interval '1 day',null); insert into studio_guidebook_sections(project_id) values('"+written+"'); update studio_access set expires_at=now()-interval '1 hour' where user_id='"+writer+"';");
  assert.match(sql(writerActor+"select studio_project_can_edit_v1('"+written+"')"),/\bf\b/);
  assert.match(sql(writerActor+"select studio_project_can_read_v1('"+written+"')"),/\bt\b/);
  sql(writerActor+"insert into studio_projects(id,owner_id) values('"+fresh+"','"+writer+"');");
  assert.match(sql(writerActor+"select studio_project_can_edit_v1('"+fresh+"')"),/\bt\b/);
  assert.match(sql("select count(*) from studio_guidebook_sections where project_id='"+written+"'"),/\b1\b/);
  console.log('PASS project boundary: trusted new binding, separate Explore project, 28-day expiry, paid precedence, over-cap preservation and foreign denial');
`;
const transformed=original.slice(0,start)+scenarios+original.slice(end).replace("  console.log('PASS: PostgreSQL capacity, soft restoration, editing, upgrade, expiry, batch rollback, concurrent inserts and isolation checks');",'');
const child=new Module(__filename,module);child.filename=__filename;child.paths=module.paths;child._compile(transformed,__filename);
