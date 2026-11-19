import type {APIRoute} from 'astro';
import {communityAdminStore} from '../../../lib/studio/communityAdmin';
import {sameOriginMutation} from '../../../lib/studio/access';
export const prerender=false;
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
export const POST:APIRoute=async({request,locals})=>{
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 try{const store=await communityAdminStore(locals);if(Number(request.headers.get('content-length')??0)>2000)throw Error('Request too large');const reader=request.body?.getReader();if(!reader)throw Error('Missing request');let bytes=0,text='';const decoder=new TextDecoder();while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>2000){await reader.cancel();throw Error('Request too large');}text+=decoder.decode(chunk.value,{stream:true});}const p=JSON.parse(text+decoder.decode());return json(await store.communityRetentionKeep(locals.user!.id,p));}
 catch{return json({error:'Protection change not confirmed. Refresh and check before trying again.'},409);}
};
