'use strict';
// Reuse the accepted disposable PostgreSQL bootstrap without changing it.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const original=fs.readFileSync(path.join(__dirname,'studio-explore-capacity-db.test.cjs'),'utf8');
const start=original.indexOf('  const owner='),end=original.indexOf("  console.log('PASS:");
if(start<0||end<=start)throw Error('FIXTURE_BOOTSTRAP_CHANGED');
const scenarios=String.raw`
  // Install the actual application's version functions in the disposable schema.
  sql("alter table studio_cards add column version_number integer not null default 1; alter table studio_cards add column content jsonb not null default '{}'::jsonb; create sequence fixture_version_ids start 1000; alter table studio_card_versions alter column id set default nextval('fixture_version_ids'); alter table studio_card_versions add column project_id uuid; alter table studio_card_versions add column version_number integer; alter table studio_card_versions add column snapshot jsonb; alter table studio_card_versions add column created_by uuid; alter table studio_guidebook_sections add column body_markdown text;");
  const foundation=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260922043000_deck_studio_project_foundation.sql'),'utf8');
  const begin=foundation.indexOf('create or replace function public.studio_bump_version()'),finish=foundation.indexOf('create or replace function public.studio_capture_guidebook_version()');
  if(begin<0||finish<=begin)throw Error('VERSION_TRIGGER_SOURCE_MISSING');
  sql(foundation.slice(begin,finish));
  sql('create trigger studio_cards_bump_version before update on studio_cards for each row execute function public.studio_bump_version(); create trigger studio_cards_capture_version after insert or update on studio_cards for each row execute function public.studio_capture_card_version();');
  const owner='00000000-0000-0000-0000-000000000041',p='10000000-0000-0000-0000-000000000041',q='10000000-0000-0000-0000-000000000042';
  const card=i=>'20000000-0000-0000-0000-'+String(i).padStart(12,'0');
  sql("insert into profiles values ('"+owner+"','member','active'); insert into studio_access values ('"+owner+"',now()-interval '1 day',now()+interval '1 day',null); insert into studio_projects(id,owner_id,settings) values ('"+p+"','"+owner+"','{\"workbook\":\"preserved\"}'); insert into studio_guidebook_sections(project_id,body_markdown) values ('"+p+"','synthetic guidebook');");
  for(let i=1;i<=11;i++)sql("insert into studio_cards(id,project_id,title,card_number,sort_order,status,content) values ('"+card(i)+"','"+p+"','Card','',"+i+",'draft','{\"meaning\":\"preserved\"}');");
  sql("update studio_access set expires_at=now()-interval '1 second'; update studio_projects set deleted_at=now() where id='"+p+"';");
  assert.throws(()=>sql("update studio_projects set deleted_at=null where id='"+p+"'"),/STUDIO_EXPLORE_CARD_CAPACITY/);
  sql("set role authenticated; set request.jwt.claim.sub='"+owner+"'; select studio_remove_deleted_project_card_v1('"+p+"','"+card(10)+"'); select studio_remove_deleted_project_card_v1('"+p+"','"+card(11)+"');");
  sql("update studio_projects set deleted_at=null where id='"+p+"'; update studio_cards set deleted_at=null where id='"+card(10)+"';");
  assert.throws(()=>sql("update studio_cards set deleted_at=null where id='"+card(11)+"'"),/STUDIO_EXPLORE_CARD_CAPACITY/);
  assert.match(sql("select count(*) from studio_cards where project_id='"+p+"' and deleted_at is null"),/\b10\b/);
  assert.match(sql("select count(*) from studio_card_versions where card_id='"+card(10)+"'"),/\b3\b/);
  assert.match(sql("select settings->>'workbook' from studio_projects where id='"+p+"'"),/preserved/);
  assert.match(sql("select body_markdown from studio_guidebook_sections where project_id='"+p+"'"),/synthetic guidebook/);
  assert.match(sql("select content->>'meaning' from studio_cards where id='"+card(10)+"'"),/preserved/);
  sql("update studio_projects set status='archived' where id='"+p+"'; insert into studio_projects(id,owner_id) values('"+q+"','"+owner+"');");
  assert.throws(()=>sql("update studio_projects set status='writing' where id='"+p+"'"),/STUDIO_EXPLORE_PROJECT_CAPACITY/);
  assert.match(sql("select status from studio_projects where id='"+p+"'"),/archived/);
  sql("update studio_projects set deleted_at=now() where id='"+q+"'; update studio_projects set status='writing' where id='"+p+"';");
  assert.match(sql("select count(*) from studio_projects where owner_id='"+owner+"' and deleted_at is null and status<>'archived'"),/\b1\b/);
  console.log('PASS extended: real card-version triggers, 11-card expired project, reversible capacity recovery, Guidebook/Workbook preservation and archived-project capacity');
`;
const transformed=original.slice(0,start)+scenarios+original.slice(end).replace("  console.log('PASS: PostgreSQL capacity, soft restoration, editing, upgrade, expiry, batch rollback, concurrent inserts and isolation checks');",'');
const child=new Module(__filename,module);child.filename=__filename;child.paths=module.paths;child._compile(transformed,__filename);
