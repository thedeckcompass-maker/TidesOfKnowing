'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ids={historical:'11000000-0000-0000-0000-000000000001',explore:'11000000-0000-0000-0000-000000000002',develop:'11000000-0000-0000-0000-000000000003',second:'11000000-0000-0000-0000-000000000004',foreign:'11000000-0000-0000-0000-000000000005'};
const card=i=>'22000000-0000-0000-0000-'+String(i).padStart(12,'0');
module.exports=async c=>{
 c.ensure();const token=u=>{assert(c.sessions[u]?.access,'Genuine session missing: '+u);return c.sessions[u].access;};
 const rest=async(u,table,method='GET',body,query='')=>c.api('/rest/v1/'+table+query,body,{token:token(u),method,headers:{Prefer:'return=representation'}});
 const rpc=async(u,name,args={})=>c.api('/rest/v1/rpc/'+name,args,{token:token(u)});
 const success=(r,label)=>c.ok(r,label);
 const deny=(r,label)=>{assert(r.status>=400||(Array.isArray(r.data)&&r.data.length===0)||r.data===false||r.data===null,label+' unexpectedly permitted access');};
 const record=(name,details={})=>{c.results.push({name,pass:true,...details});c.save();};
 if(c.operation==='identity-setup')return {users:c.users,projects:ids,cards:Array.from({length:40},(_,i)=>card(i+1))};
 if(c.operation==='prepare-executor-login'||c.operation==='executor-login'){const file=require.resolve('./dcs-connected-acceptance-executor.cjs');delete require.cache[file];return require(file)(c,c.operation==='prepare-executor-login');}
 if(c.operation==='explore'){
  assert.equal(success(await rpc('explore','studio_has_write_access'),'Explore full access'),false);
  const p=success(await rest('explore','studio_projects','POST',{id:ids.explore,owner_id:c.users.explore.id,name:'Synthetic Explore',deck_type:'oracle',pathway:'personal'}),'Explore project');assert.equal(p[0].id,ids.explore);
  assert.equal(success(await rpc('explore','studio_project_can_edit_v1',{p_project:ids.explore}),'Explore own edit'),true);
  assert.equal(success(await rpc('develop','studio_project_can_read_v1',{p_project:ids.explore}),'Cross owner RPC'),false);
  assert.deepEqual(success(await rest('develop','studio_projects','GET',undefined,'?id=eq.'+ids.explore),'Cross owner project read'),[]);
  deny(await rest('explore','studio_projects','POST',{id:ids.second,owner_id:c.users.explore.id,name:'Denied second Explore',deck_type:'oracle',pathway:'personal'}),'Explore second active project');
  for(let i=1;i<=10;i++)success(await rest('explore','studio_cards','POST',{id:card(i),project_id:ids.explore,title:'Synthetic card '+i,sort_order:i}),'Explore card '+i);
  deny(await rest('explore','studio_cards','POST',{id:card(11),project_id:ids.explore,title:'Denied eleventh',sort_order:11}),'Explore eleventh');
  success(await rest('explore','studio_cards','PATCH',{content:{text:'Synthetic saved writing'}},'?id=eq.'+card(1)),'Save card');
  const reopened=success(await rest('explore','studio_cards','GET',undefined,'?id=eq.'+card(1)),'Reopen card');assert.equal(reopened[0].content.text,'Synthetic saved writing');assert(reopened[0].version_number>=2);
  deny(await rest('develop','studio_cards','PATCH',{title:'Foreign overwrite'},'?id=eq.'+card(1)),'Cross owner update');
  success(await rest('explore','studio_cards','PATCH',{deleted_at:new Date().toISOString()},'?id=eq.'+card(10)),'Soft delete card');
  const race=await Promise.all([11,12].map(i=>rest('explore','studio_cards','POST',{id:card(i),project_id:ids.explore,title:'Concurrent '+i,sort_order:i})));
  assert.equal(race.filter(r=>r.status<300).length,1,'Concurrent capacity permits exactly one');
  deny(await rest('explore','studio_cards','PATCH',{deleted_at:null},'?id=eq.'+card(10)),'Restore above capacity');
  const winner=race[0].status<300?11:12;success(await rest('explore','studio_cards','PATCH',{deleted_at:new Date().toISOString()},'?id=eq.'+card(winner)),'Remove concurrent winner');
  success(await rest('explore','studio_cards','PATCH',{deleted_at:null},'?id=eq.'+card(10)),'Restore original card');
  success(await rest('explore','studio_cards','PATCH',{deleted_at:new Date().toISOString()},'?id=eq.'+card(9)),'Make one slot for atomic conflict test');
  const before=success(await rest('explore','studio_projects','GET',undefined,'?id=eq.'+ids.explore),'Project before capture')[0];
  const conflict=await rpc('explore','studio_capture_atomic_v1',{target_project:ids.explore,expected_updated_at:'2000-01-01T00:00:00Z',new_card:{id:card(13),title:'Must roll back',sort_order:13},new_settings:{should_not_persist:true}});
  deny(conflict,'Stale atomic capture');assert.deepEqual(success(await rest('explore','studio_cards','GET',undefined,'?id=eq.'+card(13)),'Atomic rolled back card'),[]);
  const after=success(await rest('explore','studio_projects','GET',undefined,'?id=eq.'+ids.explore),'Project after conflict')[0];assert.deepEqual(after.settings,before.settings);
  assert.equal(conflict.data?.message,'STUDIO_CAPTURE_CONFLICT','Exercise optimistic conflict after insertion, not capacity failure');
  success(await rest('explore','studio_cards','PATCH',{deleted_at:null},'?id=eq.'+card(9)),'Restore card after rolled-back capture');
  success(await rpc('explore','studio_capture_atomic_v1',{target_project:ids.explore,expected_updated_at:after.updated_at,new_card:null,new_settings:{synthetic_capture:true}}),'Atomic settings capture');
  success(await rest('explore','studio_projects','PATCH',{deleted_at:new Date().toISOString()},'?id=eq.'+ids.explore),'Delete project');
  success(await rpc('explore','studio_remove_deleted_project_card_v1',{target_project:ids.explore,target_card:card(9)}),'Remove card from deleted project');
  success(await rest('explore','studio_projects','PATCH',{deleted_at:null},'?id=eq.'+ids.explore),'Restore project');
  success(await rest('explore','studio_cards','PATCH',{deleted_at:null},'?id=eq.'+card(9)),'Restore deleted-project card');
  record('Genuine Auth/RLS Explore: capacity, concurrent insert, save/reopen, lifecycle, atomic rollback and cross-owner denial');return {passed:true};
 }
 if(c.operation==='develop'||c.operation==='develop-resume'){
  deny(await rpc('explore','studio_manage_complimentary_develop_workspace_v1',{target_user:c.users.develop.id,operation:'grant',expected_updated_at:null}),'Nonadmin grant');
  if(c.operation==='develop')success(await rpc('admin','studio_manage_complimentary_develop_workspace_v1',{target_user:c.users.develop.id,operation:'grant',expected_updated_at:null}),'Ongoing grant');
  assert.equal(success(await rpc('develop','studio_complimentary_develop_workspace_active_v1'),'Comp status'),true);
  assert.equal(success(await rpc('develop','studio_has_write_access'),'Comp full access'),true);
  if(c.operation==='develop'){
   for(const id of [ids.develop,ids.second])success(await rest('develop','studio_projects','POST',{id,owner_id:c.users.develop.id,name:'Synthetic Develop '+id.slice(-1),deck_type:'oracle',pathway:'commercial'}),'Develop project');
   for(let i=21;i<=31;i++)success(await rest('develop','studio_cards','POST',{id:card(i),project_id:ids.develop,title:'Develop card '+i,sort_order:i}),'Develop card '+i);
  }else{
   const projects=success(await rest('develop','studio_projects','GET',undefined,'?select=id,owner_id'),'Existing Develop projects');assert.equal(projects.length,2);assert(projects.every(p=>p.owner_id===c.users.develop.id));
   assert.equal(success(await rest('develop','studio_cards','GET',undefined,'?select=id&project_id=eq.'+ids.develop),'Existing Develop cards').length,11);
  }
  assert.equal(success(await rpc('develop','studio_project_can_edit_v1',{p_project:ids.develop}),'Develop edit'),true);
  const insp='44000000-0000-0000-0000-000000000001';
  success(await rpc('develop','studio_creator_inspiration_save_v1',{request_id:insp,text_value:'Synthetic inspiration',image_value:null}),'Inspiration save contract');
  success(await rpc('develop','studio_explore_inspiration_link_v1',{capture_id:insp,project_id:ids.develop}),'Develop inspiration link');
  record('Genuine authenticated ongoing Develop grant, nonadmin denial, multiple projects and more than ten cards');return {passed:true};
 }
 if(c.operation==='historical'){
  const p=success(await rest('historical','studio_projects','GET',undefined,'?id=eq.'+ids.historical),'Historical owner read');assert.equal(p.length,1);
  assert.equal(success(await rpc('historical','studio_project_can_read_v1',{p_project:ids.historical}),'Historical can read'),true);
  assert.equal(success(await rpc('historical','studio_project_can_edit_v1',{p_project:ids.historical}),'Historical cannot edit'),false);
  deny(await rest('historical','studio_projects','PATCH',{name:'Denied historical edit'},'?id=eq.'+ids.historical),'Historical write');
  assert.deepEqual(success(await rest('explore','studio_projects','GET',undefined,'?id=eq.'+ids.historical),'Foreign historical read'),[]);
  record('Unclassified historical owner read retained, writes and cross-owner reads denied');return {passed:true};
 }
 if(c.operation==='integrity-boundaries'){
  deny(await rest('explore','studio_projects','PATCH',{owner_id:c.users.develop.id},'?id=eq.'+ids.explore),'Project ownership reassignment');
  deny(await rest('explore','studio_cards','PATCH',{project_id:ids.develop},'?id=eq.'+card(1)),'Card move to foreign project');
  const original=success(await rest('explore','studio_projects','GET',undefined,'?id=eq.'+ids.explore),'Atomic race baseline')[0];
  const race=await Promise.all(['a','b'].map(label=>rpc('explore','studio_capture_atomic_v1',{target_project:ids.explore,expected_updated_at:original.updated_at,new_card:null,new_settings:{synthetic_atomic_race:label}})));
  assert.equal(race.filter(r=>r.status>=200&&r.status<300).length,1);assert.equal(race.find(r=>r.status>=400)?.data?.message,'STUDIO_CAPTURE_CONFLICT');
  deny(await rpc('admin','studio_manage_complimentary_develop_workspace_v1',{target_user:c.users.develop.id,operation:'revoke',expected_updated_at:'2000-01-01T00:00:00Z'}),'Stale grant revision');
  assert.equal(success(await rpc('develop','studio_complimentary_develop_workspace_active_v1'),'Stale grant unchanged'),true);
  deny(await rpc('admin','studio_manage_complimentary_develop_workspace_v1',{target_user:c.users.admin.id,operation:'grant',expected_updated_at:null}),'Administrator self-grant');
  deny(await rpc('admin','studio_manage_complimentary_develop_workspace_v1',{target_user:c.users.historical.id,operation:'grant',expected_updated_at:null}),'Unapproved target grant');
  record('Ownership reassignment/card move denied; concurrent atomic capture has one winner; stale/self/wrong-target grants denied');return {passed:true};
 }
 if(c.operation==='inactive-owner'){
  assert.equal(success(await rpc('historical','studio_project_can_read_v1',{p_project:ids.historical}),'Inactive owner read RPC'),false);
  assert.deepEqual(success(await rest('historical','studio_projects','GET',undefined,'?id=eq.'+ids.historical),'Inactive RLS read'),[]);
  record('Blocked synthetic profile loses project access with an existing genuine Auth session');return {passed:true};
 }
 if(c.operation==='version-restore'||c.operation==='version-restore-develop'){
  const actor=c.operation==='version-restore'?'explore':'develop',projectId=ids[actor],cardId=card(actor==='explore'?1:21),foreign=actor==='explore'?'develop':'explore';
  const before=success(await rest(actor,'studio_cards','GET',undefined,'?id=eq.'+cardId),'Versioned card')[0];
  success(await rest(actor,'studio_cards','PATCH',{content:{text:'Synthetic version edit '+before.version_number}},'?id=eq.'+cardId),'Versioned card edit');
  const current=success(await rest(actor,'studio_cards','GET',undefined,'?id=eq.'+cardId),'Current card revision')[0];
  const versions=success(await rest(actor,'studio_card_versions','GET',undefined,'?card_id=eq.'+cardId+'&order=version_number.asc'),'Card version history');assert(versions.length>=2);
  const restored=success(await rpc(actor,'studio_restore_card_version',{target_project_id:projectId,target_card_id:cardId,source_version_id:versions[0].id,expected_current_version:current.version_number}),actor+' card version restore');assert(restored>current.version_number);
  const section='55000000-0000-0000-0000-00000000000'+(actor==='explore'?'1':'2');
  if(success(await rest(actor,'studio_guidebook_sections','GET',undefined,'?id=eq.'+section),'Existing section').length===0)success(await rest(actor,'studio_guidebook_sections','POST',{id:section,project_id:projectId,section_type:'chapter',title:'Synthetic versioned section',body_markdown:'Original synthetic manuscript'}),'Create versioned section');
  const previous=success(await rest(actor,'studio_guidebook_sections','GET',undefined,'?id=eq.'+section),'Current section')[0];
  success(await rest(actor,'studio_guidebook_sections','PATCH',{body_markdown:'Edited synthetic manuscript '+previous.version_number},'?id=eq.'+section),'Edit section');
  const now=success(await rest(actor,'studio_guidebook_sections','GET',undefined,'?id=eq.'+section),'Edited section revision')[0];
  const history=success(await rest(actor,'studio_guidebook_versions','GET',undefined,'?section_id=eq.'+section+'&order=version_number.asc'),'Section history');
  const result=success(await rpc(actor,'studio_restore_guidebook_version',{target_project_id:projectId,target_section_id:section,source_version_id:history[0].id,expected_current_version:now.version_number}),actor+' guidebook version restore');assert(result>now.version_number);
  deny(await rpc(foreign,'studio_restore_card_version',{target_project_id:projectId,target_card_id:cardId,source_version_id:versions[0].id,expected_current_version:restored}),'Foreign version restore');
  record('Genuine '+actor+' card and guidebook version restoration, including provenance and foreign denial');return {passed:true};
 }
 if(c.operation==='revoke'||c.operation==='overlap'){
  const inspected=success(await rpc('admin','studio_inspect_complimentary_develop_workspace_v1',{target_user:c.users.develop.id}),'Grant revision');assert.equal(inspected.length,1);
  success(await rpc('admin','studio_manage_complimentary_develop_workspace_v1',{target_user:c.users.develop.id,operation:'revoke',expected_updated_at:inspected[0].updated_at}),'Revoke grant');
  assert.equal(success(await rpc('develop','studio_complimentary_develop_workspace_active_v1'),'Revoked comp status'),false);
  const allowed=c.operation==='overlap';assert.equal(success(await rpc('develop','studio_project_can_edit_v1',{p_project:ids.develop}),'Post revoke effective right'),allowed);
  if(!allowed){deny(await rest('develop','studio_cards','PATCH',{title:'Must not save'},'?id=eq.'+card(21)),'Revoked write');assert.equal(success(await rpc('develop','studio_project_can_read_v1',{p_project:ids.develop}),'Retained owner read'),true);}
  record(allowed?'Independent historical finite grant survives complimentary revocation':'Complimentary revocation denies write while retaining owner read');return {passed:true};
 }
 if(c.operation==='restore'){
  const g=success(await rpc('admin','studio_inspect_complimentary_develop_workspace_v1',{target_user:c.users.develop.id}),'Revoked revision')[0];
  success(await rpc('admin','studio_manage_complimentary_develop_workspace_v1',{target_user:c.users.develop.id,operation:'restore',expected_updated_at:g.updated_at}),'Restore ongoing grant');
  assert.equal(success(await rpc('develop','studio_has_write_access'),'Restored write'),true);record('Ongoing complimentary grant restored with optimistic revision');return {passed:true};
 }
 if(c.operation==='exports'){
  const snapshot=success(await rpc('develop','studio_project_export_snapshot_v1',{p_project:ids.develop}),'Project snapshot');assert.equal(snapshot.ownerId,c.users.develop.id);assert.equal(snapshot.tables.studio_cards.length,11);assert.equal(snapshot.editorial.consistent_snapshot,true);
  const exchange=success(await rpc('develop','studio_complimentary_exchange_export_snapshot_v1',{p_project:ids.develop}),'Exchange snapshot');assert.equal(exchange.ownerId,c.users.develop.id);assert.equal(exchange.rows[0].title,'Synthetic Exchange');assert(exchange.revision>0);
  deny(await rpc('explore','studio_complimentary_exchange_export_snapshot_v1',{p_project:ids.develop}),'Foreign Exchange snapshot');
  record('Authenticated project/editorial/Exchange snapshots contain own data and deny foreign owner');return {passed:true};
 }
 if(c.operation==='storage'){
  const url=c.config.url;const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS/8AAAAASUVORK5CYII=','base64');
  const paths={explore:c.users.explore.id+'/'+ids.explore+'/synthetic/image.png',develop:c.users.develop.id+'/'+ids.develop+'/synthetic/image.png'};
  async function raw(u,route,method='GET',body){const target=new URL(route,url);assert.equal(target.origin,url);c.ensure();const r=await fetch(target,{method,headers:{apikey:c.config.anonKey,authorization:'Bearer '+token(u),...(body?{'content-type':'image/png'}:{})},body,redirect:'error',signal:AbortSignal.timeout(20000)});return {status:r.status,bytes:Buffer.from(await r.arrayBuffer())};}
  for(const u of ['explore','develop']){const p='/storage/v1/object/studio-journal-photos/'+paths[u];const up=await raw(u,p,'POST',png);assert.equal(up.status,200,'Own private upload '+u);const own=await raw(u,'/storage/v1/object/authenticated/studio-journal-photos/'+paths[u]);assert.equal(own.status,200);assert.deepEqual(own.bytes,png);const foreign=await raw(u==='explore'?'develop':'explore','/storage/v1/object/authenticated/studio-journal-photos/'+paths[u]);assert(foreign.status>=400,'Foreign private download');}
  record('Two private synthetic images: own upload/download succeeds, cross-owner download denied');return {passed:true};
 }
 if(c.operation==='attach-storage'){
  const jpeg=await require('sharp')({create:{width:2,height:2,channels:3,background:'#777777'}}).jpeg().toBuffer();
  for(const [i,u] of ['explore','develop'].entries()){
   const storedPath=c.users[u].id+'/'+ids[u]+'/synthetic/image.png';
   success(await c.api('/storage/v1/object/studio-journal-photos',{prefixes:[storedPath]},{method:'DELETE',token:token(u)}),'Replace synthetic bytes within same image identity');
   const target=new URL('/storage/v1/object/studio-journal-photos/'+storedPath,c.config.url);assert.equal(target.origin,c.config.url);c.ensure();
   const upload=await fetch(target,{method:'POST',headers:{apikey:c.config.anonKey,authorization:'Bearer '+token(u),'content-type':'image/jpeg'},body:jpeg,redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(upload.status,200,'Canonical JPEG test fixture upload');
   const entry='66000000-0000-0000-0000-00000000000'+(i+1),photo='77000000-0000-0000-0000-00000000000'+(i+1);
   if(success(await rest(u,'studio_journal_entries','GET',undefined,'?id=eq.'+entry),'Existing synthetic journal').length===0)success(await rest(u,'studio_journal_entries','POST',{id:entry,project_id:ids[u],title:'Synthetic private photograph journal'}),'Create synthetic journal');
   if(success(await rest(u,'studio_journal_photos','GET',undefined,'?id=eq.'+photo),'Existing synthetic photo').length===0)success(await rest(u,'studio_journal_photos','POST',{id:photo,project_id:ids[u],journal_entry_id:entry,storage_path:storedPath,caption:'Synthetic private reference',sort_order:0}),'Attach private photograph');
  }
  record('Two existing image identities use canonical JPEG bytes and genuine user-scoped journal/photo references for complete backup');return {passed:true};
 }
 if(c.operation==='worker'){const worker=require.resolve('./dcs-connected-acceptance-worker.cjs');delete require.cache[worker];return require(worker)(c,ids);}
 if(c.operation==='logout'){
  for(const u of Object.keys(c.sessions)){if(c.sessions[u].access)success(await c.api('/auth/v1/logout?scope=global',undefined,{token:token(u)}),'Revoke synthetic session');c.sessions[u]={};}
  record('Synthetic sessions explicitly revoked');return {passed:true};
 }
 throw Error('Unknown bounded acceptance operation');
};
const executeBounded=module.exports;
module.exports=async c=>{try{return await executeBounded(c);}catch(e){
 const check=String(e.message).split('\n')[0].replace(/eyJ[A-Za-z0-9_.-]+|sb_secret_[A-Za-z0-9_-]+/g,'[redacted]');
 const location=String(e.stack).split('\n').find(x=>x.includes('dcs-connected-acceptance-')&&!x.includes('Error:'))?.trim();
 c.results.push({name:'Bounded acceptance failure',pass:false,operation:c.operation,error:e.name,check,location});c.save();throw Error('Bounded acceptance failed; see non-secret evidence');
}};
