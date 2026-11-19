// Local review adapter only; never imported by production middleware.
import {editorialSources} from './editorialSnapshots';
import {prepareServiceRecordProvider} from './serviceRecordProvider';
import {preparePostgresServiceRepository} from './postgresServiceRepository';
import {SNAPSHOT_TABLES} from './projectSnapshot';
export function localReviewIntegration(locals:any,store:any,connection:any,community:any,recipientId:string){
 const actor=locals.user?.id;if(!actor||locals.profile?.id!==actor||locals.profile.status!=='active')return {};
 // Existing synthetic review databases predate the new hosted helper. Preserve their
 // records and schema; adapt this one lookup locally, never in production composition.
 const localConnection={transaction:(work:any)=>connection.transaction((query:any)=>work((sql:string,values:any[])=>sql==='SELECT * FROM studio_private.service_actor_profiles_v1($1::uuid)'?query('SELECT id,status,role FROM public.profiles WHERE id=ANY($1::uuid[])',[[actor,recipientId]]):query(sql,values)))};
 const repository=preparePostgresServiceRepository(localConnection,actor,recipientId);
 const sources=async()=>{const state=store.get(),projects=state.tables.studio_projects.filter((p:any)=>p.owner_id===actor),items:any[]=[];for(const p of projects){const result=await editorialSources(store.client(actor),actor,p.id);items.push(...result.sources.map(s=>({...s,projectId:p.id})));}if(store.get().revision!==state.revision)throw Error('Saved work changed while reading assessment sources. Please retry.');return items;};
 return {studioServiceRecords:prepareServiceRecordProvider({enabled:true,actorId:actor,recipientId,repository:{async transaction(work:any){const items=await sources();return repository.transaction(tx=>work({...tx,sources:(owner:string)=>owner===actor?structuredClone(items):[],source:(owner:string,project:string,fingerprint:string)=>owner===actor?items.find(s=>s.projectId===project&&s.fingerprint===fingerprint)??null:null}));}}}),
 studioProjectSnapshotProvider:{async capture(owner:string,projectId:string){if(owner!==actor)throw Error('Unexpected snapshot owner.');const state=store.get(),project=state.tables.studio_projects.find((p:any)=>p.id===projectId&&p.owner_id===actor);if(!project)throw Error('Project not found.');
 const history=await community.rpc('studio_editorial_owner_history_v1',{p_project:projectId});if(history.error||!history.data?.consistent_snapshot)throw Error('Private history could not be captured.');
 const allocated=await connection.transaction(async(query:any)=>{const requests=(await query('SELECT r.* FROM public.studio_editorial_requests r JOIN studio_private.service_assessment_links_v1 l ON l.request_id=r.id WHERE r.owner_id=$1::uuid AND r.project_id=$2::uuid',[actor,projectId])).rows;const replies=(await query('SELECT v.* FROM public.studio_editorial_replies v JOIN public.studio_editorial_requests r ON r.id=v.request_id JOIN studio_private.service_assessment_links_v1 l ON l.request_id=r.id WHERE r.owner_id=$1::uuid AND r.project_id=$2::uuid',[actor,projectId])).rows;return JSON.parse(JSON.stringify({requests,replies}));});
 if(store.get().revision!==state.revision)throw Error('Project changed while preparing backup. Retry after saving.');
 const combine=(a:any[],b:any[])=>{const map=new Map<string,any>();for(const row of [...a,...b]){if(map.has(row.id)&&JSON.stringify(map.get(row.id))!==JSON.stringify(row))throw Error('Conflicting private history records.');map.set(row.id,row);}return [...map.values()];};
 return {version:1,ownerId:actor,projectId,coverage:'project-and-editorial-v1',tables:Object.fromEntries(SNAPSHOT_TABLES.map(t=>[t,structuredClone((state.tables[t]??[]).filter((r:any)=>t==='studio_projects'?r.id===projectId:r.project_id===projectId))])),editorial:{version:1,consistent_snapshot:true,requests:combine(history.data.requests??[],allocated.requests),replies:combine(history.data.replies??[],allocated.replies)}};
 }} };
}
