import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';
import {communityAdminStore} from '../../../lib/studio/communityAdmin';
export const prerender=false;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
function member(locals:any){return locals.user&&locals.profile?.id===locals.user.id&&locals.profile?.status==='active'&&locals.studioSupportHostedEnabled===true&&locals.studioSupportLocal!==true&&locals.studioSupportProvider;}
export const GET:APIRoute=async({url,locals})=>{if(!member(locals))return json({error:'Community unavailable.'},403);try{if(url.searchParams.get('view')==='moderation'){const s=await communityAdminStore(locals);return json(await s.communityModerationRead(locals.user!.id,true));}const ids=(url.searchParams.get('replies')??'').split(',').filter(Boolean);return json(await locals.studioSupportProvider.communityScribes(locals.user!.id,url.searchParams.get('post')??'',ids));}catch{return json({error:'Community unavailable.'},403);}};
export const POST:APIRoute=async({request,locals})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 if(!member(locals))return json({error:'Community unavailable.'},403);
 try{const f=await limitedForm(request,16000),action=String(f.get('action')??''),post=String(f.get('post_id')??''),reply=f.get('reply_id')?String(f.get('reply_id')):null,s=locals.studioSupportProvider,who=locals.user!.id;
  if((action==='scribe'||action==='report')&&locals.studioCommunityMemberActionsEnabled!==true)return json({error:'Community member actions are unavailable.'},503);
  if(action==='scribe'){const selected=f.get('selected');if(selected!=='true'&&selected!=='false')return json({error:'Choose appreciation state.'},400);return json(await s.communityScribe(who,post,reply,selected==='true'));}
  if(action==='report')return json(await s.communityReport(who,{post,reply,key:String(f.get('key')??''),reason:String(f.get('reason')??''),notes:String(f.get('notes')??'')}));
  if(action==='moderate'){const admin=await communityAdminStore(locals);return json(await admin.communityModerate(who,{post,reply,key:String(f.get('key')??''),action:String(f.get('transition')??''),expected:String(f.get('expected')??''),reason:String(f.get('reason')??''),report:f.get('report_id')?String(f.get('report_id')):null},true));}
  return json({error:'Unsupported Community action.'},400);
 }catch{return json({error:'Your change was not confirmed. Keep the current details and check the discussion before another action.'},409);}
};
