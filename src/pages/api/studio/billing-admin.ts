import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';
import {studioBillingFromEnvironment} from '../../../lib/studio/billingEnvironment';
export const prerender=false;
export const POST:APIRoute=async({request,locals})=>{
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile.status!=='active'||locals.profile.role!=='admin')return json({error:'Administrator access required.'},403);
 try{const provider=(locals as any).studioBillingManagement??studioBillingFromEnvironment(locals.serverRuntime?.env).studioBillingManagement;if(!provider)return json({error:'Billing administration is not activated.'},503);const form=await limitedForm(request,12000);const input=Object.fromEntries(form);const result=await provider.admin(locals.profile,input);return json({ok:true,recorded:result.recorded===true,quoteKey:result.quoteKey,amountMinor:result.quote?.unusedPrepaidMinor,currency:result.quote?.currency,settlementPending:result.settlementPending});}catch{return json({error:'The agreement could not be verified. Review the owned purchase, provider records and explicit retained terms; keep the same retry reference.'},409);}
};
