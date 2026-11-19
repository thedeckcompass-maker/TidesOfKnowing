import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../../lib/studio/access';
import {artistPortfolioStore} from '../../../../lib/studio/artistPortfolioProvider';
import {isAdminProfile} from '../../../../lib/community/auth';
import {limitedForm} from '../../../../lib/studio/limitedForm';
export const prerender=false;
export const POST:APIRoute=async({request,locals})=>{
 const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 if(!locals.user||locals.profile?.id!==locals.user.id||!isAdminProfile(locals.profile))return json({error:'Not found.'},404);
 const store=artistPortfolioStore(locals);if(!store?.hosted)return json({error:'Portfolio review is not connected yet.'},503);
 try{const form=await limitedForm(request,4000);await store.review(locals.user.id,String(form.get('id')??''),String(form.get('status')??''),String(form.get('expected_updated_at')??''));return json({ok:true,message:'Portfolio review saved. No contact details were shared and no notification was sent.'});}catch{return json({error:'Review not confirmed. Reopen the saved application before retrying.'},409);}
};
