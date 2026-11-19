import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';
import {studioBillingFromEnvironment} from '../../../lib/studio/billingEnvironment';
export const prerender=false;
export const POST:APIRoute=async({request,locals})=>{
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile.status!=='active')return json({error:'Sign in to your active account.'},401);
 try{const provider=(locals as any).studioBillingManagement??studioBillingFromEnvironment(locals.serverRuntime?.env).studioBillingManagement;if(!provider)return json({error:'Billing changes are not activated.'},503);const form=await limitedForm(request,8000);if(form.get('confirmed')!=='yes')return json({error:'Confirm the requested action.'},400);let result;
 if(form.get('action')==='cancel-create')result=await provider.cancelCreate(locals.user.id,String(form.get('subscriptionId')??''));else if(form.get('action')==='recover-checkout')result=await provider.recoverCheckout(locals.user.id);else return json({error:'Choose a supported billing action.'},400);
 return json({ok:true,...result});}catch{return json({error:'This billing action needs verification. Your account and work remain protected; no completion is claimed.'},409);}
};
