import type Stripe from 'stripe';
import {prepareAtomicBillingRepository} from './atomicBillingRepository';
import {previewStripeUpgrade} from './stripeAdjustments';
import {approveRefund,programmeAvailability} from './paymentEntitlements';
import {stripeModeMismatch,type BillingMode} from './billingMode';
import {prepareCheckoutRecovery} from './billingCheckout';
type Config=BillingMode & {stripe:Stripe;adminId:string;rpc:Parameters<typeof prepareAtomicBillingRepository>[0]['rpc'];prices:Readonly<Record<string,string>>;origin:string};
const id=(v:any):string|undefined=>typeof v==='string'?v:v?.id;
export function prepareBillingManagement(config:Config){
 const repo=(ownerId:string)=>prepareAtomicBillingRepository({ownerId,rpc:config.rpc});
 const read=async(ownerId:string)=>{const r=await config.rpc('studio_apply_verified_billing_v1',{p:{operation:'inspect',ownerId}});if(r.error||r.data?.profile?.id!==ownerId)throw Error('Verified active billing owner required.');return r.data;};
 const save=async(ownerId:string,key:string,payload:string,result:any)=>repo(ownerId).transaction(tx=>{const prior=tx.receipt('',key);if(prior){if(prior.payload!==payload)throw Error('This agreement identity already records different terms.');return prior.result;}tx.putReceipt('',key,payload,result);return result;});
 const staff=(actor:{id:string;role:string;status:string})=>{if(actor.id!==config.adminId||actor.role!=='admin'||actor.status!=='active')throw Error('Assigned active administrator required.');};
 const text=(v:unknown,max=200)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('A bounded reference is required.');return v.trim();};
 const customer=(state:any)=>{const v=state.receipts.find((r:any)=>r.key==='customer-binding')?.result?.customerId;if(!v)throw Error('Verified customer binding required.');return v as string;};
 return {
  async summary(ownerId:string){const state=await read(ownerId);return {purchases:state.enrolmentIntents.map((i:any)=>({purchaseId:i.purchaseId,offer:i.offer,billing:i.billing,subscriptionId:i.subscriptionId,supersededForAccessBy:i.supersededForAccessBy,createEndsAt:i.offer==='create'?(i.paidPeriod?.endsAt??i.promise.createEnds):(programmeAvailability(state.entries.find((e:any)=>e.id===i.id)).createEndsAt??i.promise.createEnds),cancelRequested:state.receipts.some((r:any)=>r.result?.kind==='create-renewal-stopped'&&r.result.subscriptionId===i.subscriptionId),upgrade:state.entries.find((e:any)=>e.id===i.id)?.payment?.upgrade,refund:state.entries.find((e:any)=>e.id===i.id)?.payment?.refund})),pending:state.receipts.filter((r:any)=>r.result?.kind==='checkout-claim'&&!state.receipts.some((v:any)=>v.key==='checkout-release:'+r.result.retryKey)&&!state.enrolmentIntents.some((i:any)=>i.checkoutRequestId==='studio_'+r.result.retryKey)).map((r:any)=>({offer:r.result.offer,billing:r.result.billing,purchaseId:'studio_'+r.result.retryKey}))};},
  async cancelCreate(ownerId:string,subscriptionId:string){const state=await read(ownerId),matches=state.enrolmentIntents.filter((i:any)=>i.offer==='create'&&i.subscriptionId===subscriptionId);if(matches.length!==1)throw Error('Choose your verified Create subscription.');const sub=await config.stripe.subscriptions.retrieve(subscriptionId);if(stripeModeMismatch(config,sub)||id(sub.customer)!==customer(state)||sub.metadata.studio_owner_id!==ownerId||sub.metadata.studio_offer!=='create'||sub.schedule)throw Error('Independent Create subscription required.');
   const key='cancel-create:'+subscriptionId;if(sub.status!=='canceled'&&!sub.cancel_at_period_end){const changed=await config.stripe.subscriptions.update(subscriptionId,{cancel_at_period_end:true},{idempotencyKey:key});if(stripeModeMismatch(config,changed)||!changed.cancel_at_period_end)throw Error('Cancellation not confirmed.');}
   return save(ownerId,key,subscriptionId,{kind:'create-renewal-stopped',subscriptionId,accessEndsAt:matches[0].paidPeriod?.endsAt??matches[0].promise.createEnds,contentPreserved:true,automaticResume:false});
  },
  recoverCheckout:prepareCheckoutRecovery(config),
  async admin(actor:{id:string;role:string;status:string},input:Record<string,any>){staff(actor);const ownerId=text(input.ownerId),state=await read(ownerId),purchaseId=text(input.purchaseId),key=text(input.key);if(!/^[A-Za-z0-9_-]{16,80}$/.test(key))throw Error('Stable action identity required.');
   if(input.action==='upgrade-preview'){
    const pending=state.receipts.find((r:any)=>r.result?.kind==='checkout-claim'&&'studio_'+r.result.retryKey===purchaseId);if(!pending||pending.result.offer==='create')throw Error('Choose the owner pending editorial purchase.');
    const creates=state.enrolmentIntents.filter((i:any)=>i.offer==='create'&&!i.supersededForAccessBy&&Date.parse(i.paidPeriod?.endsAt??i.promise.createEnds)>Date.now());if(creates.length!==1)throw Error('Exactly one existing prepaid Create subscription required.');
    const prior=state.receipts.find((r:any)=>r.key==='upgrade-quote:'+key);if(prior)return prior.result;
    const quote=await previewStripeUpgrade(config.stripe,{ownerId,subscriptionId:creates[0].subscriptionId,customerId:customer(state)},Math.floor(Date.now()/1000),config);
    return save(ownerId,'upgrade-quote:'+key,purchaseId,{quote,purchaseId,quoteKey:key});
   }
   if(input.action==='upgrade-approve'){
    const record=state.receipts.find((r:any)=>r.key==='upgrade-quote:'+text(input.quoteKey))?.result;if(!record||record.purchaseId!==purchaseId||!['credit','refund'].includes(input.adjustment)||input.settlementProration!=='yes')throw Error('Review the quote and explicitly approve actual prepaid value at successful enrollment.');
    const reference=text(input.reference,300),agreement={reference,approvedBy:actor.id,approvedAt:new Date().toISOString(),adjustment:input.adjustment,amountMinor:record.quote.unusedPrepaidMinor,currency:'USD',quoteId:record.quote.quoteId};
    const payload=JSON.stringify({purchaseId,quoteKey:input.quoteKey,reference,adjustment:input.adjustment,settlementProration:true});
    return save(ownerId,'upgrade-agreement:'+purchaseId,payload,{upgradeContext:{...record.quote,purchaseId,approvedAgreement:agreement,settlementProration:true},recorded:true});
   }
   if(input.action==='refund-record'){
    const intent=state.enrolmentIntents.find((i:any)=>i.purchaseId===purchaseId),entry=state.entries.find((e:any)=>e.id===intent?.id);if(!intent||!entry?.payment)throw Error('Verified programme purchase required.');
    const refund=await config.stripe.refunds.retrieve(text(input.refundId));const chargeId=id(refund.charge);if(!chargeId)throw Error('Refund charge unavailable.');
    const charges:string[]=[];
    if(intent.billing==='once'){const session=await config.stripe.checkout.sessions.retrieve(purchaseId),payment=await config.stripe.paymentIntents.retrieve(id(session.payment_intent)!);if(stripeModeMismatch(config,session)||stripeModeMismatch(config,payment)||session.client_reference_id!==ownerId||id(session.customer)!==customer(state))throw Error('Original programme payment binding mismatch.');const c=id(payment.latest_charge);if(c)charges.push(c);}
    else for(const invoiceId of intent.paidInvoiceIds){const invoice=await config.stripe.invoices.retrieve(invoiceId,{expand:['payments.data.payment.payment_intent.latest_charge']});if(stripeModeMismatch(config,invoice)||invoice.payments?.has_more||id(invoice.customer)!==customer(state)||id(invoice.parent?.subscription_details?.subscription)!==intent.subscriptionId)throw Error('Original invoice binding mismatch.');for(const row of invoice.payments?.data??[]){let c=id(row.payment.charge);if(!c&&row.payment.payment_intent){const p=typeof row.payment.payment_intent==='string'?await config.stripe.paymentIntents.retrieve(row.payment.payment_intent):row.payment.payment_intent;c=id(p.latest_charge);}if(c)charges.push(c);}}
    if(!charges.includes(chargeId))throw Error('Refund is not against a recorded programme payment.');const charge=await config.stripe.charges.retrieve(chargeId);if(stripeModeMismatch(config,charge)||id(charge.customer)!==customer(state)||!charge.paid||charge.disputed)throw Error('Refund ownership is not verified.');
    const agreement:any={kind:input.kind,reference:text(input.reference,300),approvedBy:actor.id,approvedAt:new Date().toISOString()};if(input.kind==='partial'){agreement.createEndsAt=text(input.createEndsAt);for(const k of ['consultations','reviews','groups']){if(input[k]===''||input[k]===undefined)throw Error('Explicit retained allocations required.');agreement[k]=Number(input[k]);}}
    approveRefund(structuredClone(entry),agreement,config.adminId);const attended=(state.groups??[]).filter((g:any)=>g.invitations?.some((v:any)=>v.enrolmentId===entry.id&&v.attended)).length;if(agreement.kind==='partial'&&agreement.groups<attended)throw Error('Preserve delivered group sessions.');
    const refundBinding={ownerId,purchaseId,subscriptionId:intent.subscriptionId??undefined,chargeId,customerId:customer(state),programmeChargeIds:[...new Set(charges)],amountMinor:refund.amount,agreement};
    const payload=JSON.stringify({...refundBinding,agreement:{...agreement,approvedAt:undefined}});const result=await save(ownerId,'refund-agreement:'+refund.id,payload,{refundBinding,recorded:true,settlementPending:refund.status!=='succeeded'});await config.stripe.refunds.update(refund.id,{metadata:{...refund.metadata,studio_owner_id:ownerId,studio_refund_agreement:refund.id}},{idempotencyKey:'studio-refund-binding:'+refund.id});return result;
   }
   throw Error('Unsupported billing administration action.');
  },
  async settlementUpgrade(ownerId:string,purchaseId:string,enrolledAt:string){const state=await read(ownerId),record=state.receipts.find((r:any)=>r.key==='upgrade-agreement:'+purchaseId)?.result?.upgradeContext;if(!record)return null;if(!record.settlementProration)return record;const prior=state.receipts.find((r:any)=>r.key==='upgrade-settlement:'+purchaseId)?.result?.upgradeContext;if(prior)return prior;
   const quote=await previewStripeUpgrade(config.stripe,{ownerId,subscriptionId:record.subscriptionId,customerId:record.customerId},Math.floor(Date.parse(enrolledAt)/1000),config);const upgradeContext={...quote,purchaseId,approvedAgreement:{...record.approvedAgreement,amountMinor:quote.unusedPrepaidMinor,quoteId:quote.quoteId}};return (await save(ownerId,'upgrade-settlement:'+purchaseId,purchaseId,{upgradeContext})).upgradeContext;
  }
 };
}
