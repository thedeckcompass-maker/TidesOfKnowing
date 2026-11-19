import {sameWriting} from '../../../../../lib/studio/saveState';
import type {APIRoute} from 'astro';
import {sameOriginMutation,studioProjectWriteAccessResponse as studioWriteAccessResponse} from '../../../../../lib/studio/access';
import {makeVisualUpdate} from '../../../../../lib/studio/deckDesign';
export const prerender=false;
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
export const POST:APIRoute=async({request,locals,params})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 const denied=await studioWriteAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(denied)return denied;
 if(!locals.supabase||!locals.user||!params.id)return json({error:'Not found.'},404);
 const text=await request.text();if(text.length>2200000)return json({error:'This visual draft is too large to save. Export it, then reduce reference images. Nothing was replaced.'},413);
 let input:any;try{input=JSON.parse(text);if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid draft')}catch{return json({error:'Invalid visual draft.'},400)}
 const {data:project,error}=await locals.supabase.from('studio_projects').select('id,owner_id,settings,updated_at').eq('id',params.id).eq('owner_id',locals.user.id).maybeSingle();
 if(error||!project)return json({error:'Project not found.'},404);
 if(input.expectedUpdatedAt!==project.updated_at)return json({error:'This project changed in another tab. Your draft remains here. Download it before reloading.'},409);
 const {data:cards,error:cardError}=await locals.supabase.from('studio_cards').select('id').eq('project_id',project.id).is('deleted_at',null);if(cardError)return json({error:'Cards could not be checked. Your draft remains here.'},503);
 let board;
 try{board=makeVisualUpdate(input,project.settings?.visual_design_v1,new Set((cards??[]).map(c=>c.id)))}catch(e){return json({error:(e as Error).message},400)}
 const settings=project.settings??{},prior=settings.visual_design_v1;
 // Bounded working history, with every retained version included in the existing complete backup.
 if(prior&&sameWriting(prior,board))return json({message:'No visual changes to save.',updatedAt:project.updated_at});
 const history=[...(Array.isArray(settings.visual_design_history)?settings.visual_design_history:[])];
 if(prior)history.push({saved_at:project.updated_at,board:prior});
 if(JSON.stringify({...settings,visual_design_v1:board,visual_design_history:history}).length>6500000)return json({error:'Visual history is too large for this draft record. Download your complete backup and contact support; no history was removed.'},413);
 const result=await locals.supabase.from('studio_projects').update({settings:{...settings,visual_design_v1:board,visual_design_history:history}}).eq('id',project.id).eq('owner_id',locals.user.id).eq('updated_at',project.updated_at).select('updated_at').maybeSingle();
 if(result.error||!result.data)return json({error:'The visual draft was not saved, or another tab changed it. Your draft remains here.'},409);
 return json({message:'Visual design saved. Your writing and card versions are unchanged.',updatedAt:result.data.updated_at});
};
