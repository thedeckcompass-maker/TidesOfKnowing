import type {APIRoute} from 'astro';
import {sameOriginMutation,studioProjectWriteAccessResponse as studioWriteAccessResponse} from '../../../../../lib/studio/access';
import {saveInspiration} from '../../../../../lib/studio/creativeInbox';
export const prerender=false;
const json=(v:any,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
export const POST:APIRoute=async({request,locals,params})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 const denied=await studioWriteAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(denied)return denied;
 try{const raw=await request.text();if(raw.length>500000)return json({error:'This capture is too large.'},413);const input=JSON.parse(raw),db=locals.supabase!;
 // Merge only this bounded collection into a freshly read owned project. Never replace other settings from the browser.
 for(let attempt=0;attempt<3;attempt++){const {data:project,error}=await db.from('studio_projects').select('id,owner_id,settings,updated_at').eq('id',params.id).eq('owner_id',locals.user!.id).maybeSingle();if(error)throw Error('Your project could not be loaded.');if(!project)return json({error:'Project not found.'},404);
 const saved=saveInspiration(project.settings??{},input,new Date().toISOString());if(saved.settings===project.settings)return json({entry:saved.entry,updatedAt:project.updated_at});
 const result=await db.from('studio_projects').update({settings:saved.settings}).eq('id',project.id).eq('owner_id',locals.user!.id).eq('updated_at',project.updated_at).select('updated_at').maybeSingle();if(result.error)throw Error('Your inspiration could not be saved.');if(result.data)return json({entry:saved.entry,updatedAt:result.data.updated_at});}
 return json({error:'Your project changed while saving. Your draft is kept; please try again.'},409);
 }catch(e){return json({error:(e as Error).message},400);}
};
