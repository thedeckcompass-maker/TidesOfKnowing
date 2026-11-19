// Disposable loopback database and synthetic identities only. Never accepts a hosted URL.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import pg from 'pg';

test('real restricted provider, private persistence and participant/consent lifecycle on disposable PostgreSQL',{timeout:120000},async()=>{
 const bin='C:/Users/DELL 7410/Documents/Codex/2026-10-20/task/journey-spark-evidence/editorial-db-runtime/pgsql/bin';
 const base=path.resolve('.build-temp');fs.mkdirSync(base,{recursive:true});const root=fs.mkdtempSync(path.join(base,'artist-conversation-')),data=path.join(root,'db');
 const marker=path.join(root,'fixture.json');fs.writeFileSync(marker,JSON.stringify({purpose:'artist-conversation-synthetic-test',root}));
 const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 const env={SystemRoot:process.env.SystemRoot,PATH:bin+';'+process.env.SystemRoot+'\\System32'};
 const run=(name,args)=>{const r=spawnSync(path.join(bin,name+'.exe'),args,{env,windowsHide:true,encoding:'utf8',timeout:45000});if(r.status!==0)throw Error('Disposable '+name+' failed: '+(r.error?.message??r.stderr));};
 let started=false,passed=false,admin;
 const settings={host:'127.0.0.1',port,user:'fixture',database:'postgres',password:'synthetic-local-only',connectionTimeoutMillis:5000};
 try{
  run('initdb',['-D',data,'-U','fixture','-A','trust','--no-locale']);
  const start=spawnSync(path.join(bin,'pg_ctl.exe'),['-D',data,'-l',path.join(root,'server.log'),'-o',`-h 127.0.0.1 -p ${port}`,'-w','start'],{env,windowsHide:true,stdio:'ignore',timeout:30000});
  assert.equal(start.status,0,'disposable startup');started=true;
  admin=new pg.Client(settings);await admin.connect();
  await admin.query(`CREATE ROLE dcs_service_executor NOLOGIN NOINHERIT NOBYPASSRLS;CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE SCHEMA auth;CREATE SCHEMA studio_private;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  CREATE TABLE public.profiles(id uuid PRIMARY KEY,status text,role text);CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,deleted_at timestamptz,is_anonymous boolean DEFAULT false,email_change text DEFAULT '');
  CREATE TABLE public.studio_projects(id uuid PRIMARY KEY,owner_id uuid REFERENCES public.profiles(id),name text,can_edit boolean DEFAULT true);
  CREATE TABLE public.studio_cards(id uuid PRIMARY KEY,project_id uuid REFERENCES public.studio_projects(id),body text);
  CREATE TABLE public.studio_access(user_id uuid PRIMARY KEY,starts_at timestamptz,expires_at timestamptz,revoked_at timestamptz);
  CREATE TABLE public.studio_artist_profiles(id uuid PRIMARY KEY,user_id uuid REFERENCES public.profiles(id),registration_status text,professional_name text);
  CREATE TABLE studio_private.artist_published_profiles_v1(user_id uuid PRIMARY KEY,profile_id uuid REFERENCES public.studio_artist_profiles(id));
  CREATE TABLE studio_private.artist_registration_v1(user_id uuid PRIMARY KEY,status text,participation_role text);
  CREATE FUNCTION public.studio_project_can_edit_v1(p_project uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$SELECT EXISTS(SELECT 1 FROM public.studio_projects WHERE id=p_project AND owner_id=auth.uid() AND can_edit)$$;
  CREATE FUNCTION studio_private.artist_portfolio_dispatch_v1(p_action text,p_input jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN
   IF p_action='canBrowse' THEN RETURN to_jsonb(EXISTS(SELECT 1 FROM public.studio_access WHERE user_id=auth.uid() AND starts_at<=now() AND expires_at>now() AND revoked_at IS NULL));END IF;
   IF p_action='directoryProfile' THEN RETURN coalesce((SELECT jsonb_build_object('id',a.id,'professional_name',a.professional_name) FROM public.studio_artist_profiles a JOIN studio_private.artist_published_profiles_v1 p ON p.profile_id=a.id WHERE a.id=(p_input->>'id')::uuid AND a.registration_status='active'),'false');END IF;
   RAISE EXCEPTION 'Unsupported synthetic portfolio operation';END $$;
  GRANT USAGE ON SCHEMA auth,studio_private TO dcs_service_executor;GRANT EXECUTE ON FUNCTION auth.uid() TO dcs_service_executor;`);
  const owner='11111111-1111-4111-8111-111111111111',artist='22222222-2222-4222-8222-222222222222',foreign='33333333-3333-4333-8333-333333333333',project='44444444-4444-4444-8444-444444444444',profile='55555555-5555-4555-8555-555555555555',key='66666666-6666-4666-8666-666666666666';
  for(const [id,email]of [[owner,'creator@example.invalid'],[artist,'artist@example.invalid'],[foreign,'foreign@example.invalid']]){await admin.query("INSERT INTO public.profiles VALUES($1,'active','member');",[id]);await admin.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())',[id,email]);}
  await admin.query("INSERT INTO public.studio_projects(id,owner_id,name) VALUES($1,$2,'Synthetic deck')",[project,owner]);
  await admin.query("INSERT INTO public.studio_cards VALUES('77777777-7777-4777-8777-777777777777',$1,'Preserved writing')",[project]);
  await admin.query("INSERT INTO public.studio_access VALUES($1,now()-interval '1 day',now()+interval '1 year',NULL)",[owner]);
  await admin.query("INSERT INTO public.studio_artist_profiles VALUES($1,$2,'active','Synthetic artist')",[profile,artist]);await admin.query('INSERT INTO studio_private.artist_published_profiles_v1 VALUES($1,$2)',[artist,profile]);await admin.query("INSERT INTO studio_private.artist_registration_v1 VALUES($1,'active','artist')",[artist]);
  const sql=fs.readFileSync('docs/DCS-ARTIST-CONVERSATIONS-20261117.REVIEW.sql','utf8');assert.match(sql,/ROLLBACK;\s*$/);await admin.query(sql.replace(/ROLLBACK;\s*$/,'COMMIT;'));
  const built=await build({stdin:{contents:"export * from './src/lib/studio/artistConversationProvider.ts';export * from './src/lib/studio/cloudflareServiceConnection.ts';export * from './src/pages/api/studio/artists/conversations.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',define:{'import.meta.env':'{}'},write:false});
  const mod={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));
  const provider=actor=>mod.exports.prepareArtistConversationProvider({auth:{getUser:async()=>({data:{user:{id:actor}},error:null})}},mod.exports.cloudflareServiceConnection({connectionString:'synthetic-loopback-only'},actor,()=>new pg.Client(settings)),actor);
  const creator=provider(owner),painter=provider(artist),outsider=provider(foreign);
  assert.equal(await creator.canCreator(owner),true);assert.equal(await painter.canCreator(artist),false);
  await creator.shortlist(owner,{action:'shortlist',project_id:project,artist_profile_id:profile,note:'My private choice'});assert.equal((await creator.conversations(owner)).shortlists[0].note,'My private choice');assert.equal((await painter.conversations(artist)).shortlists.length,0);
  await assert.rejects(outsider.shortlist(foreign,{project_id:project,artist_profile_id:profile,note:'Foreign write'}));
  const input={project_id:project,artist_profile_id:profile,project_label:'Synthetic deck',expected_artist_name:'Synthetic artist',brief:'A synthetic collaboration brief with more than fifty characters.',timeline:'No booking',budget_context:'No payment',request_id:key,confirmed:true,contactConfirmed:true,directContractConfirmed:true};
  await assert.rejects(creator.requestIntroduction(owner,{...input,contactConfirmed:false}));assert.equal((await creator.conversations(owner)).introductions.length,0);
  await admin.query('UPDATE public.studio_projects SET can_edit=false WHERE id=$1',[project]);await assert.rejects(creator.requestIntroduction(owner,input));await admin.query('UPDATE public.studio_projects SET can_edit=true WHERE id=$1',[project]);
  await creator.requestIntroduction(owner,input);
  const hostedLocals={user:{id:owner},profile:{id:owner,status:'active'},studioArtistConversationsEnabled:true,studioArtistConversationProvider:creator};
  const routeRead=await mod.exports.GET({locals:hostedLocals});assert.equal(routeRead.status,200);assert.equal((await routeRead.json()).introductions[0].id,key);
  assert.equal((await creator.requestIntroduction(owner,input)).repeated,true);await assert.rejects(creator.requestIntroduction(owner,{...input,brief:input.brief+' Changed.'}));
  let row=(await creator.conversations(owner)).introductions[0];assert.equal(row.contacts,null);assert.equal(row.creator_contact,undefined);assert.equal((await outsider.conversations(foreign)).introductions.length,0);
  await assert.rejects(outsider.respondIntroduction(foreign,{id:key,action:'accepted',expected_updated_at:row.updated_at,consent:true}));
  row=await painter.respondIntroduction(artist,{id:key,action:'more_information',message:'Please explain the intended visual language.',expected_updated_at:row.updated_at});assert.equal(row.status,'more_information');
  row=await creator.respondIntroduction(owner,{id:key,action:'reply',message:'Synthetic explanation, not a commission.',expected_updated_at:row.updated_at});assert.equal(row.status,'requested');
  await assert.rejects(painter.respondIntroduction(artist,{id:key,action:'accepted',expected_updated_at:row.updated_at,consent:false}));
  const accept={id:key,action:'accepted',expected_updated_at:row.updated_at,consent:true,expectedArtistContact:'artist@example.invalid'};
  await admin.query("UPDATE public.studio_artist_profiles SET registration_status='suspended' WHERE id=$1",[profile]);await assert.rejects(painter.respondIntroduction(artist,accept));await admin.query("UPDATE public.studio_artist_profiles SET registration_status='active' WHERE id=$1",[profile]);
  row=await painter.respondIntroduction(artist,accept);assert.equal(row.contacts.artist,'artist@example.invalid');assert.equal(row.contacts.creator,'creator@example.invalid');assert.equal((await painter.respondIntroduction(artist,accept)).status,'accepted');
  await admin.query("UPDATE auth.users SET email='changed@example.invalid' WHERE id=$1",[artist]);assert.equal((await creator.conversations(owner)).introductions[0].contacts,null);await admin.query("UPDATE auth.users SET email='artist@example.invalid' WHERE id=$1",[artist]);
  const stale=row.updated_at;row=await creator.respondIntroduction(owner,{id:key,action:'withdrawn',expected_updated_at:stale});assert.equal(row.contacts,null);assert.equal(row.status,'withdrawn');await assert.rejects(painter.respondIntroduction(artist,{...accept,expected_updated_at:row.updated_at}));
  await creator.shortlist(owner,{action:'remove-shortlist',project_id:project,artist_profile_id:profile});assert.equal((await creator.conversations(owner)).shortlists.length,0);
  const concurrent={...input,request_id:'99999999-9999-4999-8999-999999999999'};
  const attempts=await Promise.allSettled([creator.requestIntroduction(owner,concurrent),creator.requestIntroduction(owner,concurrent)]);assert.ok(attempts.some(x=>x.status==='fulfilled'));assert.equal((await creator.requestIntroduction(owner,concurrent)).repeated,true);
  await admin.query("UPDATE public.studio_access SET expires_at=now()-interval '1 day' WHERE user_id=$1",[owner]);assert.equal(await creator.canCreator(owner),false);assert.equal((await creator.conversations(owner)).introductions.length,2);await assert.rejects(creator.requestIntroduction(owner,{...input,request_id:'88888888-8888-4888-8888-888888888888'}));
  await admin.query('SET ROLE authenticated');await assert.rejects(admin.query("SELECT studio_private.artist_conversation_dispatch_v1('read','{}')"));await admin.query('RESET ROLE');
  await admin.query('SET ROLE dcs_service_executor');await assert.rejects(admin.query('SELECT * FROM studio_private.artist_introductions_v1'));await admin.query('RESET ROLE');
  await assert.rejects(admin.query(fs.readFileSync('docs/DCS-ARTIST-CONVERSATIONS-20261117.ROLLBACK.review.sql','utf8')));await admin.query('ROLLBACK');
  assert.equal((await admin.query('SELECT count(*)::int n FROM studio_private.artist_introductions_v1')).rows[0].n,2);assert.equal((await admin.query('SELECT body FROM public.studio_cards')).rows[0].body,'Preserved writing');assert.equal((await admin.query('SELECT count(*)::int n FROM public.profiles')).rows[0].n,3);
  passed=true;
 }finally{
  if(admin)await admin.end();
  if(started){run('pg_ctl',['-D',data,'-w','stop']);started=false;}
  if(passed&&!started){const actual=fs.realpathSync(root),mark=JSON.parse(fs.readFileSync(marker,'utf8'));assert.ok(actual.startsWith(base+path.sep)&&mark.root===root&&mark.purpose==='artist-conversation-synthetic-test');fs.rmSync(actual,{recursive:true});}
 }
});
