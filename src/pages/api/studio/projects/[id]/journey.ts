import type {APIRoute} from 'astro';
import {sameOriginMutation,studioProjectWriteAccessResponse as studioWriteAccessResponse} from '../../../../../lib/studio/access';
import {prepareJourneyUpdate} from '../../../../../lib/studio/creatorJourney';
import {prepareChapterDocuments} from '../../../../../lib/studio/chapterDocuments';
export const prerender=false;
const json=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
export const POST:APIRoute=async({request,locals,params})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 const denied=await studioWriteAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(denied)return denied;
 if(!locals.user||!locals.supabase||!params.id)return json({error:'Project not found.'},404);
 const body=await request.text();if(body.length>650000)return json({error:'This reflection is too large to save at once. Your draft has not been shortened.'},413);
 let input:any;try{input=JSON.parse(body);if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid document')}catch{return json({error:'The reflection could not be read. Keep your draft and retry.'},400)}
 const {data:project,error}=await locals.supabase.from('studio_projects').select('id,owner_id,settings,updated_at').eq('id',params.id).eq('owner_id',locals.user.id).maybeSingle();
 if(error||!project)return json({error:'Project not found.'},404);
 if(input.expectedUpdatedAt!==project.updated_at)return json({error:'This project changed in another tab. Your words are still here. Download them before reloading.'},409);
 let update;try{update=prepareJourneyUpdate(input,project.settings??{},project.updated_at);if(input.foundation||input.architecture){let cardIds=new Set<string>();if(input.architecture){const cards=await locals.supabase.from('studio_cards').select('id').eq('project_id',project.id).is('deleted_at',null);if(cards.error)return json({error:'The project card collection could not be checked. Your draft remains here.'},503);cardIds=new Set((cards.data??[]).map((c:any)=>c.id))}const settings=prepareChapterDocuments(input,update.settings,project.updated_at,cardIds);if(JSON.stringify(settings).length>6500000)throw Error('This project history needs a backup before more can be saved. No history was removed.');update.changed=update.changed||JSON.stringify(settings)!==JSON.stringify(update.settings);update.settings=settings}}catch(e){return json({error:(e as Error).message},400)}
 if(!update.changed)return json({message:'No changes to save.',updatedAt:project.updated_at,revision:update.document.revision});
 const result=await locals.supabase.from('studio_projects').update({settings:update.settings}).eq('id',project.id).eq('owner_id',locals.user.id).eq('updated_at',project.updated_at).select('updated_at').maybeSingle();
 if(result.error||!result.data)return json({error:'Your reflections could not be saved,or another tab changed the project. Keep this draft and retry.'},409);
 return json({message:'Saved.',updatedAt:result.data.updated_at,revision:update.document.revision});
};
