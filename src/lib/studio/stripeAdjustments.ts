import {billingModeEnabled,stripeModeMismatch,type BillingMode} from './billingMode';
import type Stripe from 'stripe';
import {prepareCreateUpgrade,type UpgradeAgreement} from './createUpgrade';
const id=(v:any):string|undefined=>typeof v==='string'?v:v?.id;
export type StripeUpgradeQuote={ownerId:string;subscriptionId:string;customerId:string;invoiceId:string;chargeId:string;quoteId:string;unusedPrepaidMinor:number;currency:'USD';prorationAt:number};
/** Retrieval/preview only. Persist this quote with the explicit administrator agreement. */
export async function previewStripeUpgrade(stripe:Stripe,binding:{ownerId:string;subscriptionId:string;customerId:string},prorationAt:number,config:BillingMode={testMode:true}):Promise<StripeUpgradeQuote>{
 const sub=await stripe.subscriptions.retrieve(binding.subscriptionId);
 if(stripeModeMismatch(config,sub)||id(sub.customer)!==binding.customerId||sub.metadata.studio_owner_id!==binding.ownerId||sub.metadata.studio_offer!=='create'||sub.items.has_more||sub.items.data.length!==1)throw Error('Existing Create subscription ownership is unverified.');
 const invoice=await stripe.invoices.retrieve(id(sub.latest_invoice)!,{expand:['payments.data.payment.payment_intent.latest_charge']});
 if(stripeModeMismatch(config,invoice)||invoice.status!=='paid'||invoice.currency!=='usd'||id(invoice.customer)!==binding.customerId||invoice.payments?.has_more||invoice.payments?.data.length!==1)throw Error('A single verified paid invoice is required.');
 const payment=invoice.payments.data[0].payment;let chargeId=id(payment.charge);
 if(!chargeId&&payment.payment_intent){const pi=typeof payment.payment_intent==='string'?await stripe.paymentIntents.retrieve(payment.payment_intent):payment.payment_intent;chargeId=id(pi.latest_charge);}
 if(!chargeId)throw Error('Original settled charge unavailable.');const charge=await stripe.charges.retrieve(chargeId);
 if(stripeModeMismatch(config,charge)||!charge.paid||charge.currency!=='usd'||id(charge.customer)!==binding.customerId||charge.disputed)throw Error('Paid charge ownership is unverified.');
 const preview=await stripe.invoices.createPreview({customer:binding.customerId,subscription:binding.subscriptionId,subscription_details:{cancel_now:true,proration_behavior:'create_prorations',proration_date:prorationAt,items:sub.items.data.map(i=>({id:i.id,quantity:i.quantity}))}});
 if(stripeModeMismatch(config,preview)||preview.currency!=='usd'||preview.lines.has_more)throw Error('Complete test-mode proration preview required.');
 const credits=preview.lines.data.filter(l=>l.parent?.subscription_item_details?.proration);if(credits.some(l=>l.amount>0))throw Error('Unexpected debit in upgrade preview.');const amount=-credits.reduce((sum,l)=>sum+l.amount,0);
 if(!Number.isSafeInteger(amount)||amount<0||amount>charge.amount-charge.amount_refunded)throw Error('Prorated adjustment exceeds verified prepaid value.');
 return {...binding,invoiceId:invoice.id,chargeId,quoteId:preview.id,unusedPrepaidMinor:amount,currency:'USD',prorationAt};
}
/** Concrete Stripe operations; test objects verified before mutations. Tests must mock these calls. */
export function prepareStripeUpgrade(config:{stripe:Stripe;adminId:string;testMode:boolean;productionRelease?:string;loadQuote:(ownerId:string,subscriptionId:string)=>Promise<(StripeUpgradeQuote & {approvedAgreement:UpgradeAgreement;purchaseId:string})|null>}){
 return async(...args:Parameters<ReturnType<typeof prepareCreateUpgrade>>)=>{let quote:StripeUpgradeQuote|null=null;
 return prepareCreateUpgrade({adminId:config.adminId,
  inspect:async(ownerId,subscriptionId)=>{if(!billingModeEnabled(config))throw Error('Financial activation required.');quote=await config.loadQuote(ownerId,subscriptionId);if(!quote||(quote as StripeUpgradeQuote & {purchaseId:string}).purchaseId!==args[1]||JSON.stringify((quote as StripeUpgradeQuote & {approvedAgreement:UpgradeAgreement;purchaseId:string}).approvedAgreement)!==JSON.stringify(args[3])||quote.ownerId!==ownerId||quote.subscriptionId!==subscriptionId)throw Error('Stored approved proration quote required.');const sub=await config.stripe.subscriptions.retrieve(subscriptionId);if(stripeModeMismatch(config,sub)||id(sub.customer)!==quote.customerId||sub.metadata.studio_owner_id!==ownerId||sub.metadata.studio_offer!=='create')throw Error('Subscription binding mismatch.');return {...quote,verified:true};},
  stopRenewals:async(subscriptionId,key)=>{const current=await config.stripe.subscriptions.retrieve(subscriptionId);if(stripeModeMismatch(config,current))throw Error('Live changes disabled.');const stopped=current.status==='canceled'?current:await config.stripe.subscriptions.cancel(subscriptionId,{prorate:false,invoice_now:false},{idempotencyKey:key});if(stripeModeMismatch(config,stopped)||stopped.status!=='canceled')throw Error('Renewal stop not verified.');return {subscriptionId,renewalsStopped:true,verified:true};},
  adjust:async(subscriptionId,agreement:UpgradeAgreement,key)=>{
   if(!quote||quote.subscriptionId!==subscriptionId||quote.quoteId!==agreement.quoteId)throw Error('Verified quote missing.');const stripe=config.stripe;
   if(agreement.amountMinor===0)return {id:'zero:'+quote.quoteId,amountMinor:0,kind:agreement.adjustment,verified:true};
   if(agreement.adjustment==='credit'){
    const history=await stripe.customers.listBalanceTransactions(quote.customerId,{limit:100});if(history.has_more)throw Error('Credit history requires reconciliation.');const prior=history.data.filter(v=>v.metadata?.studio_adjustment_key===key);if(prior.length>1)throw Error('Duplicate adjustment requires reconciliation.');
    const credit=prior[0]??await stripe.customers.createBalanceTransaction(quote.customerId,{amount:-agreement.amountMinor,currency:'usd',description:'Approved unused Create value',metadata:{studio_adjustment_key:key,studio_agreement:agreement.reference}},{idempotencyKey:key});
    if(credit.amount!==-agreement.amountMinor||credit.currency!=='usd'||id(credit.customer)!==quote.customerId)throw Error('Credit response mismatch.');return {id:credit.id,amountMinor:agreement.amountMinor,kind:'credit',verified:true};
   }
   const charge=await stripe.charges.retrieve(quote.chargeId);if(stripeModeMismatch(config,charge)||id(charge.customer)!==quote.customerId||charge.currency!=='usd')throw Error('Refund charge mismatch.');const history=await stripe.refunds.list({charge:quote.chargeId,limit:100});if(history.has_more)throw Error('Refund history requires reconciliation.');const prior=history.data.filter(v=>v.metadata?.studio_adjustment_key===key);if(prior.length>1)throw Error('Duplicate refund requires reconciliation.');
   const refund=prior[0]??await stripe.refunds.create({charge:quote.chargeId,amount:agreement.amountMinor,reason:'requested_by_customer',metadata:{studio_adjustment_key:key,studio_agreement:agreement.reference}},{idempotencyKey:key});
   if(refund.status!=='succeeded'||refund.amount!==agreement.amountMinor||refund.currency!=='usd'||id(refund.charge)!==quote.chargeId)throw Error('Refund has not settled.');return {id:refund.id,amountMinor:refund.amount,kind:'refund',verified:true};
  }})(...args);};
}
