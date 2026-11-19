import type {APIRoute} from 'astro';
import {sameOriginMutation,studioAccountAccessResponse} from '../../../lib/studio/access';
import {saveInspiration} from '../../../lib/studio/creativeInbox';
import {accountInspiration} from '../../../lib/studio/accountInspiration';
export const prerender=false;
const json=(v:any,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
export const GET:APIRoute=async({locals,url})=>{
 if(!locals.user||locals.profile?.status!=='active'||!locals.supabase)return json({error:'Sign in to your active account.'},401);
 const {data,error}=await locals.supabase.from('studio_creator_inspiration').select('inbox,revision,updated_at').eq('owner_id',locals.user.id).maybeSingle();
 if(error)return json({error:'Saved inspiration is temporarily unavailable.'},503);if(!data)return json({error:'No accessible saved inspiration was found.'},404);
 try{const inbox=accountInspiration(data.inbox);if(url.searchParams.get('download')==='1')return new Response(JSON.stringify({format:'dcs-private-inspiration-v1',exportedAt:new Date().toISOString(),inbox},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="my-private-inspiration.json"','Cache-Control':'private,no-store'}});return json({...data,inbox});}catch{return json({error:'Saved inspiration needs review. Nothing was changed.'},409);}
};
export const POST:APIRoute=async({request,locals})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);const denied=await studioAccountAccessResponse(locals.user,locals.profile,locals.supabase);if(denied)return denied;
 try{const raw=await request.text();if(raw.length>500000)return json({error:'This capture is too large.'},413);const input=JSON.parse(raw),db=locals.supabase!;
 if(input.action==='link'){if(!/^[a-f0-9-]{36}$/i.test(input.captureId)||!/^[a-f0-9-]{36}$/i.test(input.projectId))return json({error:'Choose a saved idea and one of your projects.'},400);const {data,error}=await db.rpc('studio_explore_inspiration_link_v1',{capture_id:input.captureId,project_id:input.projectId});if(error)return json({error:'This idea could not be linked. Check the selected project and whether it is already linked elsewhere. Your original is kept.'},409);return json(data);}
 const validated=saveInspiration({},input,new Date().toISOString()).entry;
 const {data,error}=await db.rpc('studio_creator_inspiration_save_v1',{request_id:validated.id,text_value:validated.text,image_value:validated.image});if(error)return json({error:'Your inspiration could not be saved. Keep this draft and retry; nothing was removed.'},409);accountInspiration({version:1,entries:[data]});return json({entry:data});
 }catch(e){return json({error:(e as Error).message},400);}
};
