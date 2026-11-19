import type {APIRoute} from 'astro';
export const prerender=false;
/** Optional server-composed provider. Signature verification belongs to that provider.
 * A browser session or posted owner/price never authorises fulfilment. */
export const POST:APIRoute=async({request,locals})=>{
 let provider=(locals as any).studioBillingWebhook;
 try{if(!provider){const {studioBillingFromEnvironment}=await import('../../../lib/studio/billingEnvironment');provider=studioBillingFromEnvironment(locals.serverRuntime?.env).studioBillingWebhook;}}catch{return new Response('Studio billing configuration unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});}
 const response=(body:object,status:number)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(typeof provider!=='function')return response({error:'Studio billing is not activated.'},503);
 try{const result=await provider(request);return response({received:true,...result},200);}
 catch{return response({received:false,error:'Billing event was not accepted; retain it for verified retry.'},400);}
};
