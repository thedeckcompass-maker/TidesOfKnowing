import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';
import {studioBillingFromEnvironment} from '../../../lib/studio/billingEnvironment';
export const prerender=false;
export const POST:APIRoute=async({request,locals})=>{
 const json=(error:string,status:number)=>new Response(JSON.stringify({error}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(!sameOriginMutation(request))return json('Invalid request origin.',403);
 if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile.status!=='active')return json('Sign in to your active account.',401);
 try{const provider=(locals as any).studioBillingCheckout??studioBillingFromEnvironment(locals.serverRuntime?.env).studioBillingCheckout;if(!provider)return json('Studio purchasing is not activated.',503);
 const form=await limitedForm(request,8000);if(form.get('termsAccepted')!=='yes')return json('Confirm the displayed payment arrangement before continuing.',400);
 const result=await provider(locals.user.id,String(form.get('name')??''),String(form.get('offer')??''),String(form.get('billing')??''),String(form.get('retryKey')??''));
 if(!result.url||!['https://checkout.stripe.com','https://invoice.stripe.com'].includes(new URL(result.url).origin))return json('Verified payment destination unavailable.',409);
 return new Response(null,{status:303,headers:{Location:result.url,'Cache-Control':'no-store'}});
 }catch{return json('This purchase needs verification or its original retry. No access has been granted.',409);}
};
