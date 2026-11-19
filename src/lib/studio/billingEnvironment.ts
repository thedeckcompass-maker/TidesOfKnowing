import Stripe from 'stripe';
import {createClient} from '@supabase/supabase-js';
import {composeStudioBilling} from './billingRuntime';
import {BILLING_RELEASE} from './billingMode';
export function billingConfigurationEnabled(env:Record<string,unknown>={}){return env.STUDIO_BILLING_TEST_ENABLED==='true'||(env.STUDIO_BILLING_LIVE_ENABLED==='true'&&env.STUDIO_BILLING_RELEASE===BILLING_RELEASE);}
/** Server-only. Code supports a separately authorised release; this does not install any binding. */
export function studioBillingFromEnvironment(env:Record<string,unknown>={}){
 if(!billingConfigurationEnabled(env))return composeStudioBilling();
 if(env.STUDIO_BILLING_TEST_ENABLED==='true'&&env.STUDIO_BILLING_LIVE_ENABLED==='true')throw Error('Choose exactly one billing mode.');
 const value=(key:string)=>typeof env[key]==='string'?env[key] as string:'';
 const testMode=env.STUDIO_BILLING_TEST_ENABLED==='true',prefix=testMode?'STUDIO_STRIPE_TEST_':'STUDIO_STRIPE_LIVE_';
 const secret=value(prefix+'SECRET_KEY'),webhookSecret=value(prefix+'WEBHOOK_SECRET'),adminId=value('STUDIO_BILLING_ADMIN_ID'),url=value('PUBLIC_SUPABASE_URL'),serviceKey=value('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret.startsWith(testMode?'sk_test_':'sk_live_')||!webhookSecret.startsWith('whsec_')||!serviceKey||!/^https:\/\/vbdqvjvhjleqdadiiqjx\.supabase\.co\/?$/.test(url)||!/^[a-f0-9-]{36}$/i.test(adminId))throw Error('Billing configuration is incomplete or mode-mismatched.');
 const prices:unknown=JSON.parse(value(prefix+'PRICES_JSON'));
 if(!prices||Array.isArray(prices)||typeof prices!=='object'||Object.values(prices).some(v=>typeof v!=='string'||!/^price_[A-Za-z0-9_]+$/.test(v)))throw Error('Server-owned price catalog required.');
 const stripe=new Stripe(secret),client=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 return composeStudioBilling({enabled:true,testMode,productionRelease:testMode?undefined:value('STUDIO_BILLING_RELEASE'),stripe,webhookSecret,adminId,prices:prices as Record<string,string>,rpc:async(name,args)=>{const {data,error}=await client.rpc(name,args);return {data,error};}});
}
