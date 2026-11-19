import {STANDARD_OFFERS} from './serviceOffers';
import {billingModeEnabled,stripeModeMismatch,type BillingMode} from './billingMode';
import {prepareAtomicBillingRepository} from './atomicBillingRepository';
import type Stripe from 'stripe';
import {prepareStudioCheckout} from './stripeCheckout';
import {prepareStripePurchaseBindings} from './stripePurchaseBindings';
import {servicePurchase} from './servicePurchase';
import {programmeAvailability} from './paymentEntitlements';
export function prepareBillingCheckout(config:{stripe:Stripe;testMode:boolean;productionRelease?:string;adminId:string;rpc:Parameters<typeof prepareStripePurchaseBindings>[0]['rpc'];prices:Readonly<Record<string,string>>;origin:string}){
 const bindings=prepareStripePurchaseBindings(config),checkout=prepareStudioCheckout(config);
 return async(ownerId:string,name:string,offer:string,billing:string,retryKey:string)=>{
  const choice=servicePurchase(offer,billing);if(!choice||!/^[A-Za-z0-9_-]{16,80}$/.test(retryKey))throw Error('Choose an approved plan and keep the purchase retry identity.');
  const response=await config.rpc('studio_apply_verified_billing_v1',{p:{operation:'inspect',ownerId}});if(response.error||response.data?.profile?.id!==ownerId)throw Error('Verified active account required.');const state=response.data;
  const activeCreate=state.enrolmentIntents.filter((i:any)=>i.offer==='create'&&!i.supersededForAccessBy&&Date.parse(i.paidPeriod?.endsAt??i.promise.createEnds)>Date.now());
  if(offer==='create'&&(activeCreate.length||state.entries.some((e:any)=>e.payment&&Date.parse(programmeAvailability(e).createEndsAt??'')>Date.now())))throw Error('Existing Create access is still active. Do not start duplicate billing.');
  const claim=await prepareAtomicBillingRepository({ownerId,rpc:config.rpc}).transaction(tx=>{
   const current=tx.load(),pending=current.billingReceipts.filter((r:any)=>r.result?.kind==='checkout-claim'&&!current.billingReceipts.some((v:any)=>v.key==='checkout-release:'+r.result.retryKey)&&!current.enrolmentIntents.some((i:any)=>i.checkoutRequestId==='studio_'+r.result.retryKey));
   if(pending.length){const prior=pending[pending.length-1].result;if(prior.offer!==offer||prior.billing!==billing)throw Error('An earlier purchase is awaiting completion or reconciliation.');return prior;}
   const result={kind:'checkout-claim',retryKey,offer,billing,createdAt:Date.now()};tx.putReceipt('','checkout-claim:'+retryKey,JSON.stringify({offer,billing}),result);return result;
  });

  retryKey=claim.retryKey;
  if(offer!=='create'&&activeCreate.length){const context=state.receipts.find((r:any)=>r.key==='upgrade-agreement:studio_'+retryKey)?.result?.upgradeContext;if(activeCreate.length!==1||context?.ownerId!==ownerId||context?.purchaseId!=='studio_'+retryKey||context?.subscriptionId!==activeCreate[0].subscriptionId||context?.approvedAgreement?.approvedBy!==config.adminId)throw Error('Record the agreed unused-Create adjustment before purchasing this upgrade.');}
  const customerId=await bindings.customer(ownerId,name);
  if(billing!=='instalments'){
   const history=await config.stripe.checkout.sessions.list({customer:customerId,limit:100});if(history.has_more)throw Error('Checkout history needs reconciliation.');const matches=history.data.filter(v=>v.metadata?.studio_purchase_id==='studio_'+retryKey);if(matches.length>1)throw Error('Duplicate checkout identity.');
   if(matches.length){const session=matches[0];if(stripeModeMismatch(config,session)||session.metadata?.studio_owner_id!==ownerId||session.status!=='open'||session.payment_status==='paid'||!session.url)throw Error('Original checkout is settled or closed; reconcile it before another purchase.');return {id:session.id,url:session.url};}
   if(!Number.isSafeInteger(claim.createdAt)||Date.now()-claim.createdAt>23*60*60*1000)throw Error('This earlier purchase needs provider reconciliation before another checkout attempt.');
   return checkout(ownerId,offer,billing,retryKey,customerId);
  }
  const result=await bindings.schedule(ownerId,customerId,offer as 'collaborate'|'develop',Math.floor(Date.now()/1000),retryKey,name);
  if(!result.subscriptionId)throw Error('The fixed schedule is being prepared. Keep this purchase identity and retry; do not create another purchase.');
  const subscription=await config.stripe.subscriptions.retrieve(result.subscriptionId);if(stripeModeMismatch(config,subscription))throw Error('Live billing disabled.');
  await config.stripe.subscriptions.update(subscription.id,{payment_settings:{save_default_payment_method:'on_subscription'}},{idempotencyKey:'studio-method:'+result.purchaseId});
  const invoiceId=typeof subscription.latest_invoice==='string'?subscription.latest_invoice:subscription.latest_invoice?.id;
  if(!invoiceId)throw Error('Initial invoice is not ready. Retry this same purchase.');let invoice=await config.stripe.invoices.retrieve(invoiceId);const expected=STANDARD_OFFERS[offer as 'collaborate'|'develop'].instalment*100;if(stripeModeMismatch(config,invoice)||invoice.customer!==customerId||invoice.currency!=='usd'||invoice.amount_due!==expected)throw Error('Initial invoice ownership or amount mismatch.');if(invoice.status==='draft')invoice=await config.stripe.invoices.finalizeInvoice(invoiceId,{auto_advance:true},{idempotencyKey:'studio-initial-invoice:'+result.purchaseId});const url=invoice.hosted_invoice_url;
  if(stripeModeMismatch(config,invoice)||!url||new URL(url).origin!=='https://invoice.stripe.com')throw Error('Verified test invoice page is not ready. Retry this same purchase.');return {id:result.purchaseId,url};
 };
}

/** Explicit owner action: reconcile only the pending owned purchase, never cancel a paid programme. */
export function prepareCheckoutRecovery(config:Parameters<typeof prepareBillingCheckout>[0]){
 return async(ownerId:string)=>{
  const repository=prepareAtomicBillingRepository({ownerId,rpc:config.rpc});
  const state=await repository.transaction(tx=>tx.load()),claims=state.billingReceipts.filter((r:any)=>r.result?.kind==='checkout-claim'&&!state.billingReceipts.some((v:any)=>v.key==='checkout-release:'+r.result.retryKey)&&!state.enrolmentIntents.some((i:any)=>i.checkoutRequestId==='studio_'+r.result.retryKey));
  if(claims.length!==1)throw Error('Exactly one pending purchase required.');const claim=claims[0].result,customer=state.billingReceipts.find((r:any)=>r.key==='customer-binding')?.result?.customerId;if(!customer)throw Error('Customer binding requires reconciliation.');
  const purchaseId='studio_'+claim.retryKey;
  if(claim.billing==='instalments'){
   const history=await config.stripe.subscriptionSchedules.list({customer,limit:100});if(history.has_more)throw Error('Complete schedule history required.');const schedules=history.data.filter(v=>v.metadata?.studio_purchase_id===purchaseId);if(schedules.length!==1)throw Error('A verified schedule is required before cancelling a pending instalment purchase.');const schedule=schedules[0];if(stripeModeMismatch(config,schedule)||schedule.metadata?.studio_owner_id!==ownerId)throw Error('Schedule ownership mismatch.');
   const subscription=(typeof schedule.subscription==='string'?schedule.subscription:schedule.subscription?.id)??state.billingReceipts.find((r:any)=>r.key==='schedule:'+claim.retryKey)?.result?.subscriptionId;
   if(!subscription)throw Error('Schedule subscription unavailable.');const invoices=await config.stripe.invoices.list({subscription,limit:100});if(invoices.has_more||!invoices.data.length)throw Error('Complete initial invoice history required.');
   for(const invoice of invoices.data){if(stripeModeMismatch(config,invoice)||invoice.amount_paid!==0||!['draft','open','void'].includes(invoice.status??''))throw Error('A paid or unresolved purchase cannot be abandoned.');const detail=await config.stripe.invoices.retrieve(invoice.id,{expand:['payments.data.payment.payment_intent']});if(detail.payments?.has_more)throw Error('Complete invoice payments required.');for(const payment of detail.payments?.data??[]){const v=payment.payment.payment_intent;if(!v)throw Error('Payment state needs review.');const intent=typeof v==='string'?await config.stripe.paymentIntents.retrieve(v):v;if(stripeModeMismatch(config,intent)||!['requires_payment_method','canceled'].includes(intent.status))throw Error('An in-flight payment cannot be cancelled as an abandoned checkout.');}}
   if(schedule.status!=='canceled')await config.stripe.subscriptionSchedules.cancel(schedule.id,{invoice_now:false,prorate:false},{idempotencyKey:'studio-abandon:'+purchaseId});
   for(const invoice of invoices.data){const current=await config.stripe.invoices.retrieve(invoice.id);if(current.amount_paid!==0)throw Error('Payment arrived during reconciliation; retain the purchase.');if(current.status==='open')await config.stripe.invoices.voidInvoice(current.id,{}, {idempotencyKey:'studio-abandon-invoice:'+current.id});}
  }else{
   const history=await config.stripe.checkout.sessions.list({customer,limit:100});if(history.has_more)throw Error('Complete checkout history required.');const matches=history.data.filter(v=>v.metadata?.studio_purchase_id===purchaseId);if(matches.length>1)throw Error('Duplicate checkout needs review.');
   if(matches.length){let session=matches[0];if(stripeModeMismatch(config,session)||session.metadata?.studio_owner_id!==ownerId||session.payment_status==='paid'||session.status==='complete')throw Error('Settled checkout needs payment reconciliation.');if(session.status==='open')session=await config.stripe.checkout.sessions.expire(session.id,{}, {idempotencyKey:'studio-expire:'+purchaseId});if(session.status!=='expired')throw Error('Checkout closure not verified.');}
   else if(!Number.isSafeInteger(claim.createdAt)||Date.now()-claim.createdAt<24*60*60*1000)throw Error('Uncertain recent checkout must be retried with its original identity.');
  }
  return repository.transaction(tx=>{const current=tx.load();if(current.enrolmentIntents.some((i:any)=>i.checkoutRequestId===purchaseId))throw Error('Payment was recorded; retain this purchase.');const key='checkout-release:'+claim.retryKey,prior=tx.receipt('',key);if(prior)return prior.result;const result={closed:true,purchaseId,accountPreserved:true};tx.putReceipt('',key,purchaseId,result);return result;});
 };
}
