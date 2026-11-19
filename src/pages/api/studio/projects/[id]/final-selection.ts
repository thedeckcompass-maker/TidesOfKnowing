import type {APIRoute} from 'astro';
import {sameOriginMutation,studioProjectWriteAccessResponse as studioWriteAccessResponse} from '../../../../../lib/studio/access';
import {finalSelection,prepareFinalSelection} from '../../../../../lib/studio/finalSelection';
import {getDeletedStudioCardIds} from '../../../../../lib/studio/queries';
export const prerender=false;
const json=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
export const POST:APIRoute=async({request,locals,params})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 const denied=await studioWriteAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(denied)return denied;
 if(!locals.user||!locals.supabase||!params.id)return json({error:'Project not found.'},404);
 const body=await request.text();if(body.length>1800000)return json({error:'This draft is too large. Nothing was shortened.'},413);
 let input:any;try{input=JSON.parse(body);if(!input||typeof input!=='object')throw Error()}catch{return json({error:'Invalid draft.'},400)}
 const {data:project,error}=await locals.supabase.from('studio_projects').select('id,owner_id,settings,updated_at').eq('id',params.id).eq('owner_id',locals.user.id).maybeSingle();
 if(error||!project)return json({error:'Project not found.'},404);
 if(input.expectedUpdatedAt!==project.updated_at)return json({error:'This project changed. Keep your draft and reopen before retrying.'},409);
 const cards=await locals.supabase.from('studio_cards').select('id').eq('project_id',project.id).is('deleted_at',null);if(cards.error)return json({error:'Cards could not be checked.'},503);
 let deletedCardIds:string[];try{deletedCardIds=await getDeletedStudioCardIds(locals.supabase,project.id)}catch{return json({error:'Deleted card history could not be checked. Your draft remains here.'},503)}
 let settings;try{settings=prepareFinalSelection(project.settings??{},input,cards.data??[],project.updated_at,deletedCardIds)}catch(e){return json({error:(e as Error).message},409)}
 if(settings===project.settings)return json({updatedAt:project.updated_at,selection:finalSelection(settings,cards.data??[],deletedCardIds)});
 const saved=await locals.supabase.from('studio_projects').update({settings}).eq('id',project.id).eq('owner_id',locals.user.id).eq('updated_at',project.updated_at).select('updated_at').maybeSingle();
 if(saved.error||!saved.data)return json({error:'Save not confirmed. Keep your draft; check the saved page before retrying.'},409);
 return json({updatedAt:saved.data.updated_at,selection:finalSelection(settings,cards.data??[],deletedCardIds)});
};
