import type {ServiceRepository,ServiceTransaction} from './serviceRecordProvider';
import {editorialSources} from './editorialSnapshots';
export type SqlQuery=(sql:string,values?:unknown[])=>Promise<{rows:any[]}>;
export interface PrivatePgConnection {transaction<T>(work:(query:SqlQuery)=>Promise<T>):Promise<T>}
/** Candidate for a trusted server connection, never a browser database client.
 * Connection must provide SERIALIZABLE transactions and rollback on every failure.
 * No connection, credentials, schema or activation are created by this factory. */
export function preparePostgresServiceRepository(connection:PrivatePgConnection,actorId:string,recipientId:string,verifiedEnrolmentOwner?:string):ServiceRepository{
 return {async transaction(work,scope){return connection.transaction(async query=>{
  const identity=await query("SELECT current_setting('request.jwt.claim.sub',true) AS actor");if(identity.rows[0]?.actor!==actorId)throw Error('Database session identity does not match the verified actor.');
  const ledger=await query('SELECT body FROM studio_private.service_ledger_v1 WHERE singleton=true FOR UPDATE');if(ledger.rows.length!==1)throw Error('Service ledger is not provisioned.');
  const profiles=(await query('SELECT * FROM studio_private.service_actor_profiles_v1($1::uuid)',[verifiedEnrolmentOwner??null])).rows;
  const recordsOnly=scope==='records-only';
  // Ordinary display reads need linked correspondence only when a saved review
  // actually refers to it. Mutation/source-selection scopes retain the full path.
  const hasLinkedAssessment=Array.isArray(ledger.rows[0].body?.entries)&&ledger.rows[0].body.entries.some((entry:any)=>Array.isArray(entry?.reviews)&&entry.reviews.some((review:any)=>!!review?.requestId));
  const loadAssessments=scope!=='ledger-only'&&(!recordsOnly||hasLinkedAssessment);
  const requests=loadAssessments?(await query('SELECT r.* FROM public.studio_editorial_requests r JOIN studio_private.service_assessment_links_v1 l ON l.request_id=r.id')).rows.map(r=>({...r,purpose:'allocated-assessment'})):[];
  const replies=loadAssessments?(await query('SELECT r.* FROM public.studio_editorial_replies r JOIN studio_private.service_assessment_links_v1 l ON l.request_id=r.request_id')).rows:[];
  // read() never consults retry receipts; action and quotation scopes still do.
  const receipts=recordsOnly?[]:(await query('SELECT actor_id,key,payload,result FROM studio_private.service_receipts_v1 WHERE actor_id=$1::uuid',[actorId])).rows;
  // Allowance/history reads need linked assessments and replies, not every saved
  // source in the actor's projects. Source selection/submission keeps full scope.
  const projects=scope==='ledger-only'||scope==='records-only'?[]:(await query('SELECT id FROM public.studio_projects WHERE owner_id=$1::uuid',[actorId])).rows;
  const allowed=new Set(['studio_projects','studio_cards','studio_card_versions','studio_guidebook_sections','studio_guidebook_versions']);
  const client:any={from(table:string){if(!allowed.has(table))throw Error('Unsupported source table.');let fields='*',order='';const filters:string[]=[],values:unknown[]=[];const valid=(s:string)=>{if(!/^[a-z_]+$/.test(s))throw Error('Invalid source column.');return s;};const run=async()=>{try{return {data:(await query(`SELECT ${fields} FROM public.${table}${filters.length?' WHERE '+filters.join(' AND '):''}${order}`,values)).rows,error:null};}catch(e){return {data:null,error:e};}};const q:any={select(s:string){fields=s.split(',').map(valid).join(',');return q;},eq(k:string,v:unknown){values.push(v);filters.push(valid(k)+'=$'+values.length);return q;},order(k:string,o:any={}){order=' ORDER BY '+valid(k)+(o.ascending===false?' DESC':'');return q;},async maybeSingle(){const r=await run();return {...r,data:r.data?.[0]??null};},then(a:any,b:any){return run().then(a,b);}};return q;}};
  const sources:any[]=[];for(const p of projects){const data=await editorialSources(client,actorId,p.id);sources.push(...data.sources.map(s=>({...s,projectId:p.id})));}if(sources.length>1000)throw Error('Source selection is too large; no incomplete list returned.');
  let state=structuredClone(ledger.rows[0].body),dirty=false;const newRequests:any[]=[],newReplies:any[]=[],newReceipts:any[]=[];
  const tx:ServiceTransaction={load:()=>structuredClone(state),save:v=>{state=structuredClone(v);dirty=true;},profile:id=>profiles.find(p=>p.id===id)??null,source:(owner,project,fp)=>owner===actorId?sources.find(s=>s.projectId===project&&s.fingerprint===fp)??null:null,sources:owner=>owner===actorId?structuredClone(sources):[],request:id=>structuredClone(requests.find(r=>r.id===id)??null),putRequest:r=>{const at=requests.findIndex(v=>v.id===r.id);if(at>=0)requests[at]=structuredClone(r);else requests.push(structuredClone(r));newRequests.push(r);},replies:id=>structuredClone(replies.filter(r=>r.request_id===id)),putReply:r=>{replies.push(structuredClone(r));newReplies.push(r);},receipt:(actor,key)=>receipts.find(r=>r.actor_id===actor&&r.key===key)??null,putReceipt:(actor,key,payload,result)=>{if(actor!==actorId)throw Error('Unexpected receipt actor.');newReceipts.push({actor,key,payload,result});}};
  const existingIds=new Set(requests.map(r=>r.id)),result=work(tx);
  for(const r of newRequests){const columns=['id','owner_id','recipient_id','project_id','snapshot_version','source_kind','source_id','source_version','source_version_id','source_fingerprint','title','selected_text','selected_image','question','constraints','submission_key','prior_request_id','status','revision','created_at'];const saved=existingIds.has(r.id)?await query('UPDATE public.studio_editorial_requests SET status=$2,revision=$3 WHERE id=$1::uuid RETURNING id',[r.id,r.status,r.revision]):await query(`INSERT INTO public.studio_editorial_requests (${columns.join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING id`,columns.map(k=>r[k]??null));if(saved.rows.length!==1||saved.rows[0].id!==r.id)throw Error('Assessment write was not confirmed.');if(!existingIds.has(r.id))await query('INSERT INTO studio_private.service_assessment_links_v1(request_id) VALUES($1::uuid)',[r.id]);}
  for(const r of newReplies)await query('INSERT INTO public.studio_editorial_replies(id,request_id,author_id,submission_key,body,visibility,created_at) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7)',[r.id,r.request_id,r.author_id,r.submission_key,r.body,r.visibility,r.created_at]);
  if(dirty)await query('UPDATE studio_private.service_ledger_v1 SET body=$1::jsonb WHERE singleton=true',[JSON.stringify(state)]);
  for(const r of newReceipts)await query('INSERT INTO studio_private.service_receipts_v1(actor_id,key,payload,result) VALUES($1::uuid,$2,$3,$4::jsonb)',[r.actor,r.key,r.payload,JSON.stringify(r.result)]);
  return result;
 });}};
}
