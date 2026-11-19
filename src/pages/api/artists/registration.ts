import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../lib/studio/access';
import {artistRegistrationStore} from '../../../lib/studio/artistRegistrationProvider';
export const prerender=false;
export const POST:APIRoute=async({request,locals})=>{const json=(v:any,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile.status!=='active')return json({error:'Sign in with your active account.'},401);const store=artistRegistrationStore(locals);if(!store?.registerRole)return json({error:'Registration is not connected.'},503);try{const body=await request.text();if(body.length>2000)return json({error:'Request too large.'},413);const input=JSON.parse(body);return json(await store.registerRole(locals.user.id,input.role,input.revision))}catch(e){return json({error:(e as Error).message},409)}};

