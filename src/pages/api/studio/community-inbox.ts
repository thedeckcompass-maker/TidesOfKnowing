import type {APIRoute} from 'astro';
import {communityAdminStore} from '../../../lib/studio/communityAdmin';
import {sameOriginMutation} from '../../../lib/studio/access';
export const prerender=false;
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
export const POST:APIRoute=async({request,locals})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 try{const store=await communityAdminStore(locals);const reader=request.body?.getReader();if(!reader)throw Error('No command.');let text='',bytes=0;const decoder=new TextDecoder();while(true){const next=await reader.read();if(next.done)break;bytes+=next.value.byteLength;if(bytes>20000){await reader.cancel();return json({error:'Command too large.'},413);}text+=decoder.decode(next.value,{stream:true});}text+=decoder.decode();return json(await store.communityInboxCommand(locals.user!.id,JSON.parse(text)));}
 catch{return json({error:'This action was not confirmed. Refresh and check before trying again. Nothing is retried automatically.'},409);}
};
