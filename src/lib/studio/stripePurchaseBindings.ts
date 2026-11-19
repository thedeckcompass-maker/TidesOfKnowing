import {billingModeEnabled,stripeModeMismatch,type BillingMode} from './billingMode';
import type Stripe from 'stripe';
import {prepareAtomicBillingRepository} from './atomicBillingRepository';
import {studioInstalmentScheduleParameters} from './stripeCheckout';
import {newPurchaseOfferVersion,supportedPaymentPromise} from './serviceOffers';
type Rpc=Parameters<typeof prepareAtomicBillingRepository>[0]['rpc'];
const objectId=(v:any):string|undefined=>typeof v==='string'?v:v?.id;
/** Customer/purchase bindings live in the existing atomic receipt ledger; no new tables. */
export function prepareStripePurchaseBindings(config:{stripe:Stripe;rpc:Rpc;prices:Readonly<Record<string,string>>;testMode:boolean;productionRelease?:string}){
 const checkMode=async()=>{if(!billingModeEnabled(config))throw Error('Billing activation required.');const p=await config.stripe.prices.retrieve(config.prices['create:monthly']);if(stripeModeMismatch(config,p)||p.unit_amount!==1200||p.currency!=='usd')throw Error('Approved test catalog required before any provider mutation.');};
 const repository=(ownerId:string)=>prepareAtomicBillingRepository({ownerId,rpc:config.rpc});
 const read=async(ownerId:string,key:string)=>repository(ownerId).transaction(tx=>tx.receipt('',key)?.result??null);
 const save=async(ownerId:string,key:string,payload:string,result:any)=>repository(ownerId).transaction(tx=>{const prior=tx.receipt('',key);if(prior){if(prior.payload!==payload)throw Error('Purchase binding conflicts with its original request.');return prior.result;}tx.putReceipt('',key,payload,result);return result;});
 return {
  async customer(ownerId:string,name:string){
   const prior=await read(ownerId,'customer-binding');if(prior){const customer=await config.stripe.customers.retrieve(prior.customerId);if(customer.deleted||stripeModeMismatch(config,customer)||customer.metadata.studio_owner_id!==ownerId)throw Error('Recorded customer ownership mismatch.');return customer.id;}
   if(!name?.trim()||name.length>200)throw Error('Account name required.');await checkMode();
   const found=await config.stripe.customers.search({query:`metadata['studio_owner_id']:'${ownerId}' AND metadata['studio_purpose']:'deck-creator-studio'`,limit:2});if(found.has_more||found.data.length>1)throw Error('Customer binding needs explicit reconciliation.');const customer=found.data[0]??await config.stripe.customers.create({name,metadata:{studio_owner_id:ownerId,studio_purpose:'deck-creator-studio'}},{idempotencyKey:'studio-customer:'+ownerId});
   if(stripeModeMismatch(config,customer)||customer.metadata.studio_owner_id!==ownerId)throw Error('Test customer binding unverified.');
   const saved=await save(ownerId,'customer-binding',ownerId,{customerId:customer.id});return saved.customerId;
  },
  async schedule(ownerId:string,customerId:string,offer:'collaborate'|'develop',startAt:number,retryKey:string,name:string){
   if(!/^[A-Za-z0-9_-]{16,80}$/.test(retryKey))throw Error('Stable purchase identity required.');const customer=await read(ownerId,'customer-binding');if(customer?.customerId!==customerId)throw Error('Use the account-owned customer binding.');
   const key='schedule:'+retryKey,payload=JSON.stringify({ownerId,customerId,offer,name}),prior=await read(ownerId,key);if(prior){if(prior.purchasePayload!==payload)throw Error('Purchase retry differs from its original request.');return prior;}
   const purchaseId='studio_'+retryKey,recorded=await read(ownerId,'purchase:'+purchaseId);if(recorded&&(recorded.purchasePayload!==payload||recorded.ownerId!==ownerId||recorded.offer!==offer))throw Error('Recorded purchase identity changed.');const offerVersion=recorded?.offerVersion??newPurchaseOfferVersion(offer);if(!supportedPaymentPromise(offerVersion,offer))throw Error('Recorded initial purchase version requires reconciliation.');await checkMode();const price=await config.stripe.prices.retrieve(config.prices[offer+':instalments']);const params=studioInstalmentScheduleParameters({ownerId,customerId,offer,startAt},price,config);
   params.start_date='now';params.metadata={...params.metadata,studio_offer_version:offerVersion,studio_purchase_id:purchaseId};params.phases![0].metadata={...params.phases![0].metadata,studio_offer_version:offerVersion,studio_purchase_id:purchaseId};
   // Persist identity before initiation: a webhook racing the provider response can resolve it.
   await save(ownerId,'purchase:'+purchaseId,payload,{purchaseId,ownerId,customerId,name,offer,offerVersion,purchasePayload:payload});
   const existing=await config.stripe.subscriptionSchedules.list({customer:customerId,limit:100});if(existing.has_more)throw Error('Schedule history needs explicit reconciliation before another purchase.');const matches=existing.data.filter(s=>s.metadata?.studio_purchase_id===purchaseId);if(matches.length>1)throw Error('Duplicate schedule identity requires reconciliation.');const schedule=matches[0]??await config.stripe.subscriptionSchedules.create(params,{idempotencyKey:'studio-schedule:'+ownerId+':'+retryKey});
   if(stripeModeMismatch(config,schedule)||schedule.end_behavior!=='cancel'||objectId(schedule.customer)!==customerId)throw Error('Schedule response mismatch.');
   return save(ownerId,key,payload,{scheduleId:schedule.id,purchaseId,subscriptionId:objectId(schedule.subscription),purchasePayload:payload});
  },
  async resolve(subscriptionId:string){
   const sub=await config.stripe.subscriptions.retrieve(subscriptionId);if(stripeModeMismatch(config,sub))throw Error('Live billing disabled.');const ownerId=sub.metadata.studio_owner_id,purchaseId=sub.metadata.studio_purchase_id;
   if(!ownerId||!purchaseId)return null;const binding=await read(ownerId,'purchase:'+purchaseId);
   if(!binding||binding.ownerId!==ownerId||binding.customerId!==objectId(sub.customer)||binding.offer!==sub.metadata.studio_offer||binding.offerVersion!==sub.metadata.studio_offer_version)return null;return binding;
  }
 };
}
