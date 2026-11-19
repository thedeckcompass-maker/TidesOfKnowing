import type {APIRoute} from 'astro';
import {communityAdminStore} from '../../../lib/studio/communityAdmin';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';
export const prerender=false;
export const POST:APIRoute=async({request,locals})=>{
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 try{const store=await communityAdminStore(locals),f=await limitedForm(request,30000);
 return json(await store.communityAdminReply(locals.user!.id,{postId:String(f.get('post_id')),key:String(f.get('submission_key')),expectedRevision:Number(f.get('expected_revision')),body:String(f.get('body')??'')},true));
 }catch(e){return json({error:(e as Error).message+' Your draft remains here.'},409);}
};
export const GET:APIRoute=async({locals})=>{try{const store=await communityAdminStore(locals);return new Response(JSON.stringify({posts:await store.communityAdminRead(locals.user!.id,true)}),{headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});}catch{return new Response(JSON.stringify({error:'This queue is not available.'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});}};
