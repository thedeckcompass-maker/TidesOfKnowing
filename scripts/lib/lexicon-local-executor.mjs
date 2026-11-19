import {prepareLexiconImport} from './lexicon-import-plan.mjs';

const quote=s=>'"'+s.replaceAll('"','""')+'"';
async function boundary(c) {
  if(c.connectionParameters?.host!=='127.0.0.1'||c.connectionParameters?.database!=='dcs_lexicon_local')throw Error('LOCAL_DEMO_DATABASE_REQUIRED');
  const r=await c.query("select current_database() db, host(inet_server_addr()) addr");
  if(r.rows[0]?.db!=='dcs_lexicon_local'||r.rows[0]?.addr!=='127.0.0.1')throw Error('LOCAL_DEMO_DATABASE_REQUIRED');
}
export async function verifyPreviewBoundary(c, authorization) {
  const project='utzcmbidotxgmulguzxo';
  if(authorization!==`AUTHORIZE PREVIEW LEXICON ${project}`)throw Error('PREVIEW_AUTHORIZATION_REQUIRED');
  if(c.connectionParameters?.host!==`db.${project}.supabase.co`||c.connectionParameters?.database!=='postgres'||!c.connectionParameters?.ssl||c.connectionParameters.ssl.rejectUnauthorized===false)throw Error('VERIFIED_PREVIEW_TLS_CONNECTION_REQUIRED');
  const result=await c.query("select e.project_ref, s.ssl from dcs_demo.environment e join pg_stat_ssl s on s.pid=pg_backend_pid() where e.singleton=true");
  if(result.rowCount!==1||result.rows[0].project_ref!==project||result.rows[0].ssl!==true)throw Error('PREVIEW_SERVER_IDENTITY_REQUIRED');
}
async function owner(c,id){
  const r=await c.query("select p.id from public.profiles p join auth.users u on u.id=p.id join dcs_demo.grants g on g.owner_id=p.id where p.id=$1 and p.status='active' and g.kind='develop-demo' and g.revoked_at is null and g.starts_at<=now() and g.expires_at>now() for update of p,g",[id]);
  if(r.rowCount!==1)throw Error('ACTIVE_DEVELOP_DEMO_OWNER_REQUIRED');
}
async function tables(c){
  return (await c.query("select table_name from information_schema.columns where table_schema='public' and column_name='project_id' order by table_name")).rows.map(r=>r.table_name);
}
async function lock(c){
  const names=await tables(c);
  await c.query('lock table public.studio_projects'+names.map(n=>',public.'+quote(n)).join('')+' in share row exclusive mode');
  return names;
}
async function snapshot(c,id,names){
  const state={project:(await c.query('select to_jsonb(p) row from public.studio_projects p where id=$1',[id])).rows};
  for(const name of names)state[name]=(await c.query('select to_jsonb(t) row from public.'+quote(name)+' t where project_id=$1 order by to_jsonb(t)::text',[id])).rows;
  return state;
}
async function insert(c,table,row){
  const keys=Object.keys(row);
  await c.query('insert into public.'+quote(table)+' ('+keys.map(quote).join(',')+') values ('+keys.map((_,i)=>'$'+(i+1)).join(',')+')',keys.map(k=>row[k]));
}
async function importLexicon(c,fixture,options,checkBoundary,stateLabel){
  const stage=value=>options.onStage?.(value);
  stage('IMPORT_BOUNDARY');
  await checkBoundary(c);
  stage('IMPORT_MAPPING');
  const p=prepareLexiconImport(fixture,options);
  if(options.actorId!==p.ownerId)throw Error('OWNER_MISMATCH');
  stage('TRANSACTION_BEGIN');
  await c.query('begin');
  try{
    await c.query("set local lock_timeout='5s'");
    stage('ENTITLEMENT_VERIFICATION');
    await owner(c,p.ownerId);
    stage('IMPORT_LOCKS');
    const names=await lock(c);
    await checkBoundary(c);
    await c.query("select set_config('request.jwt.claim.sub',$1,true)",[p.ownerId]);
    stage('DUPLICATE_VERIFICATION');
    const prior=await c.query('select 1 from dcs_demo.imports where owner_id=$1 or project_id=$2',[p.ownerId,p.projectId]);
    if(prior.rowCount)throw Error('DUPLICATE_DEMO_IMPORT');
    const {updated_at,...project}=p.projectFields;
    project.settings={...project.settings,custom:{lexicon_demo:{source:p.sourceSha256,provenance:fixture.provenance,preserved:p.unmapped,reviewRequired:['browser-held edits','artwork','credits','rights','editorial approval']}}};
    stage('PROJECT_INSERT');
    await insert(c,'studio_projects',project);
    stage('FAMILIES_INSERT');
    for(const f of p.families)await insert(c,'studio_card_families',f);
    stage('CARDS_INSERT');
    for(const card of p.cards)await insert(c,'studio_cards',card);
    stage('GUIDEBOOK_INSERT');
    for(const section of p.sections)await insert(c,'studio_guidebook_sections',section);
    stage('JOURNAL_INSERT');
    for(const j of p.journals){const {source_date,...journal}=j;await insert(c,'studio_journal_entries',{...journal,entry_kind:'reflection',tags:[],selected_for_process:false});}
    stage('PROVENANCE_INSERT');
    for(const [kind,rows] of [['card_family',p.families],['card',p.cards],['guidebook_section',p.sections]])for(const row of rows){
      await insert(c,'studio_import_records',{project_id:p.projectId,source_system:'lexicon-demo-v1',source_key:kind+':'+row.id,source_path:fixture.provenance.source,source_checksum:p.sourceSha256,target_type:kind,target_id:row.id,payload:JSON.stringify({fixtureSourceSha256:p.sourceSha256})});
    }
    stage('IMPORT_SNAPSHOT');
    const state=await snapshot(c,p.projectId,names);
    stage('IMPORT_RECEIPT');
    await c.query('insert into dcs_demo.imports(owner_id,project_id,source_sha256,snapshot) values($1,$2,$3,$4)',[p.ownerId,p.projectId,p.sourceSha256,JSON.stringify(state)]);
    stage('TRANSACTION_COMMIT');
    await c.query('commit');
    return {state:stateLabel,projectId:p.projectId,cards:p.cards.length,route:'/studio/projects/'+p.projectId+'/'};
  }catch(e){try{await c.query('rollback');}catch{/* Outcome must be checked from the scoped receipt; retain original failure. */}throw e;}
}
async function reverseLexicon(c,{ownerId,actorId,projectId,approved=false},checkBoundary,stateLabel){
  await checkBoundary(c);if(!approved||actorId!==ownerId)throw Error('EXPLICIT_OWNER_REVERSAL_REQUIRED');
  await c.query('begin');
  try{
    await owner(c,ownerId);const names=await lock(c);
    await checkBoundary(c);
    await c.query("select set_config('request.jwt.claim.sub',$1,true)",[ownerId]);
    const receipt=(await c.query('select snapshot from dcs_demo.imports where owner_id=$1 and project_id=$2 for update',[ownerId,projectId])).rows[0];
    if(!receipt)throw Error('IMPORT_RECEIPT_REQUIRED');
    if(JSON.stringify(receipt.snapshot)!==JSON.stringify(JSON.parse(JSON.stringify(await snapshot(c,projectId,names))))) {
      // JSONB canonical key order differs from JS insertion order.
      const same=await c.query('select $1::jsonb=$2::jsonb same',[JSON.stringify(receipt.snapshot),JSON.stringify(await snapshot(c,projectId,names))]);
      if(!same.rows[0].same)throw Error('DEMO_CHANGED_REVERSAL_REFUSED');
    }
    // Soft reversal preserves dependent records, versions and the import receipt.
    // The preview's existing lifecycle supports archived_at and status=archived.
    await c.query("update public.studio_projects set status='archived',archived_at=now() where id=$1 and owner_id=$2",[projectId,ownerId]);
    await c.query('commit');return {state:stateLabel,projectId};
  }catch(e){await c.query('rollback');throw e;}
}
export const importLexiconLocal=(c,fixture,options)=>importLexicon(c,fixture,options,boundary,'IMPORTED_LOCAL_ONLY');
export const reverseLexiconLocal=(c,options)=>reverseLexicon(c,options,boundary,'ARCHIVED_LOCAL_ONLY');
async function previewScope(c,options){
  await verifyPreviewBoundary(c,options.authorization);
  const approved=await c.query('select 1 from dcs_demo.preview_owners where owner_id=$1 and project_id=$2',[options.ownerId,options.projectId]);
  if(approved.rowCount!==1)throw Error('DEDICATED_PREVIEW_OWNER_APPROVAL_REQUIRED');
  const other=await c.query('select 1 from public.studio_projects where owner_id=$1 and id<>$2 limit 1',[options.ownerId,options.projectId]);
  if(other.rowCount)throw Error('PREVIEW_OWNER_NOT_ISOLATED');
}
export const importLexiconPreview=(c,fixture,options)=>importLexicon(c,fixture,options,client=>previewScope(client,options),'IMPORTED_PREVIEW');
export const reverseLexiconPreview=(c,options)=>reverseLexicon(c,options,client=>previewScope(client,options),'ARCHIVED_PREVIEW');
