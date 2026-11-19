import {billingModeEnabled,stripeModeMismatch,type BillingMode} from './billingMode';
import type Stripe from 'stripe';
import type {RefundAgreement} from './paymentEntitlements';
import type {VerifiedLifecycle} from './enrolmentLifecycle';
const id=(v:any):string|undefined=>typeof v==='string'?v:v?.id;
/** Administrator agreement is trusted stored configuration, never webhook metadata or browser input. */
export function prepareStripeRefundVerifier(config:{stripe:Stripe;webhookSecret:string;testMode:boolean;productionRelease?:string;resolve:(refundId:string)=>Promise<{ownerId:string;purchaseId:string;subscriptionId?:string;chargeId:string;customerId:string;programmeChargeIds:string[];amountMinor:number;agreement:RefundAgreement}|null>;now?:()=>number}){
 return async(request:Request):Promise<VerifiedLifecycle>=>{
  if(!billingModeEnabled(config))throw Error('Live refunds disabled.');const signature=request.headers.get('stripe-signature'),raw=await request.text();if(!signature||raw.length>1000000)throw Error('Signed bounded refund event required.');
  const event=await config.stripe.webhooks.constructEventAsync(raw,signature,config.webhookSecret);if(stripeModeMismatch(config,event)||!['refund.created','refund.updated'].includes(event.type))throw Error('Unsupported refund event.');
  const refund=await config.stripe.refunds.retrieve(id(event.data.object)!);const agreement=await config.resolve(refund.id);if(!agreement)throw Error('Recorded approved refund agreement required.');const charge=await config.stripe.charges.retrieve(agreement.chargeId);
  if(stripeModeMismatch(config,charge)||id(refund.charge)!==charge.id||refund.status!=='succeeded'||refund.currency!=='usd'||refund.amount!==agreement.amountMinor||id(charge.customer)!==agreement.customerId||!charge.paid||charge.disputed)throw Error('Refund settlement or owner could not be verified.');
  if(agreement.agreement.kind==='full'){if(!agreement.programmeChargeIds.includes(charge.id)||agreement.programmeChargeIds.length<1||agreement.programmeChargeIds.length>3)throw Error('Complete recorded programme charge set required.');for(const chargeId of agreement.programmeChargeIds){const original=chargeId===charge.id?charge:await config.stripe.charges.retrieve(chargeId);if(stripeModeMismatch(config,original)||id(original.customer)!==agreement.customerId||!original.paid||original.amount_refunded!==original.amount)throw Error('Full refund requires every recorded programme charge to be refunded.');}}
  return {verified:true,eventId:event.id,ownerId:agreement.ownerId,purchaseId:agreement.purchaseId,subscriptionId:agreement.subscriptionId??undefined,observedAt:(config.now??Date.now)(),kind:'refund',refundVerified:true,refundAgreement:agreement.agreement};
 };
}
