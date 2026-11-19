import {billingModeEnabled,stripeModeMismatch,type BillingMode} from './billingMode';
import type Stripe from 'stripe';
import {INITIAL_UNLOCK_DEVELOP_VERSION,supportedPaymentPromise,offersForVersion,addCalendarMonths} from './serviceOffers';
import type {VerifiedEnrolment} from './enrolmentFulfilment';
import type {VerifiedLifecycle} from './enrolmentLifecycle';
const id=(v:any):string|undefined=>typeof v==='string'?v:v?.id;
/** Test-mode signed invoice adapter. The binding is an existing trusted purchase record,
 * never a browser request or unverified invoice metadata. */
export function prepareProgrammeInvoiceVerifier(config:{stripe:Stripe;webhookSecret:string;testMode:boolean;productionRelease?:string;prices:Readonly<Record<string,string>>;resolve:(subscriptionId:string)=>Promise<{ownerId:string;purchaseId:string;name:string;offer:'collaborate'|'develop';offerVersion:string}|null>;now?:()=>number}){
 return async(request:Request):Promise<{initial:VerifiedEnrolment}|{lifecycle:VerifiedLifecycle}>=>{
  if(!billingModeEnabled(config))throw Error('Programme payment adapter is not activated.');
  const signature=request.headers.get('stripe-signature'),raw=await request.text();if(!signature||raw.length>1000000)throw Error('Signed bounded invoice event required.');
  const event=await config.stripe.webhooks.constructEventAsync(raw,signature,config.webhookSecret);
  if(stripeModeMismatch(config,event)||!['invoice.paid','invoice.payment_failed'].includes(event.type))throw Error('Unsupported programme event.');
  const invoice=await config.stripe.invoices.retrieve(id(event.data.object)!);
  const subscriptionId=id(invoice.parent?.subscription_details?.subscription);if(!subscriptionId)throw Error('Subscription identity missing.');
  const binding=await config.resolve(subscriptionId);if(!binding)throw Error('Existing trusted purchase binding required.');
  if(binding.offerVersion===INITIAL_UNLOCK_DEVELOP_VERSION&&binding.offer!=='develop')throw Error('New Develop promise cannot classify another programme.');
  const terms=offersForVersion(binding.offerVersion)[binding.offer],sub=await config.stripe.subscriptions.retrieve(subscriptionId),line=invoice.lines.data[0];
  const price=config.prices[binding.offerVersion+':'+binding.offer+':instalments']??(supportedPaymentPromise(binding.offerVersion,binding.offer)?config.prices[binding.offer+':instalments']:undefined);
  if(!price||stripeModeMismatch(config,invoice)||stripeModeMismatch(config,sub)||id(invoice.customer)!==id(sub.customer)||sub.metadata.studio_owner_id!==binding.ownerId||sub.metadata.studio_offer!==binding.offer||sub.metadata.studio_offer_version!==binding.offerVersion||sub.metadata.studio_billing!=='instalments'||invoice.lines.has_more||invoice.lines.data.length!==1||line.quantity!==1||line.pricing?.price_details?.price!==price||line.parent?.subscription_item_details?.proration!==false||invoice.currency!=='usd'||invoice.amount_due!==terms.instalment*100)throw Error('Programme invoice does not match the recorded owner and price.');
  const item=sub.items.data[0];if(sub.items.has_more||sub.items.data.length!==1||item.quantity!==1||item.price.id!==price||item.price.unit_amount!==terms.instalment*100||item.price.currency!=='usd'||item.price.recurring?.interval!=='month'||item.price.recurring.interval_count!==1)throw Error('Monthly programme price mismatch.');
  const scheduleId=id(sub.schedule);if(!scheduleId)throw Error('Bounded programme schedule required.');let schedule=await config.stripe.subscriptionSchedules.retrieve(scheduleId);const phase=schedule.phases[0];
  const start=phase&&new Date(phase.start_date*1000).toISOString(),end=start&&addCalendarMonths(start.slice(0,10),terms.payments)+start.slice(10);
  const adjustedAt=schedule.metadata?.studio_enrolled_at;
  const validItems=(v:Stripe.SubscriptionSchedule.Phase)=>v.items.length===1&&id(v.items[0].price)===price&&v.items[0].quantity===1;
  const adjustedValid=!!adjustedAt&&schedule.phases.length===2&&schedule.phases.every(validItems)&&phase.end_date===schedule.phases[1].start_date&&phase.end_date*1000===Date.parse(addCalendarMonths(adjustedAt.slice(0,10),1)+adjustedAt.slice(10))&&schedule.phases[1].end_date*1000===Date.parse(addCalendarMonths(adjustedAt.slice(0,10),terms.payments)+adjustedAt.slice(10));
  if(stripeModeMismatch(config,schedule)||schedule.end_behavior!=='cancel'||!phase||!(adjustedValid||(!adjustedAt&&schedule.phases.length===1&&validItems(phase)&&phase.end_date*1000===Date.parse(end!)))||schedule.metadata?.studio_owner_id!==binding.ownerId||schedule.metadata?.studio_payment_count!==String(terms.payments))throw Error('Fixed monthly payment count is unverified.');
  const common={verified:true as const,eventId:event.id,purchaseId:binding.purchaseId,ownerId:binding.ownerId,subscriptionId,observedAt:(config.now??Date.now)(),invoiceId:invoice.id};
  if(event.type==='invoice.payment_failed'){if(invoice.status!=='open'||invoice.amount_paid!==0||!invoice.attempted)throw Error('Failure is no longer current.');return {lifecycle:{...common,kind:'payment-failed',failedAt:new Date(event.created*1000).toISOString()}};}
  if(invoice.status!=='paid'||invoice.amount_paid!==terms.instalment*100||!invoice.status_transitions.paid_at)throw Error('Successful invoice payment required.');const settledAt=new Date(invoice.status_transitions.paid_at*1000).toISOString();
  if(invoice.billing_reason==='subscription_create'){
   if(adjustedAt&&adjustedAt!==settledAt)throw Error('Adjusted schedule disagrees with original settlement.');
   if(!adjustedAt&&settledAt.slice(0,10)!==start!.slice(0,10)){
    // Preserve the settled initial invoice; move only the not-yet-invoiced future instalments.
    const history=await config.stripe.invoices.list({subscription:subscriptionId,limit:100});if(history.has_more||history.data.some(v=>v.id!==invoice.id&&v.status!=='void'))throw Error('A later invoice already exists; reconcile it before changing dates.');
    const nextAt=Date.parse(addCalendarMonths(settledAt.slice(0,10),1)+settledAt.slice(10))/1000,endAt=Date.parse(addCalendarMonths(settledAt.slice(0,10),terms.payments)+settledAt.slice(10))/1000;
    if(nextAt<=(config.now??Date.now)()/1000)throw Error('Remaining due date has already passed; recorded payment reconciliation is required.');
    const metadata={...schedule.metadata,studio_enrolled_at:settledAt,studio_initial_invoice:invoice.id};
    const adjusted=await config.stripe.subscriptionSchedules.update(scheduleId,{end_behavior:'cancel',proration_behavior:'none',metadata,phases:[{start_date:phase.start_date,end_date:nextAt,items:[{price,quantity:1}],metadata:sub.metadata,proration_behavior:'none'},{start_date:nextAt,end_date:endAt,items:[{price,quantity:1}],metadata:sub.metadata,billing_cycle_anchor:'phase_start',proration_behavior:'none'}]},{idempotencyKey:'studio-enrolment-dates:'+invoice.id});
    if(stripeModeMismatch(config,adjusted)||adjusted.end_behavior!=='cancel'||adjusted.phases.length!==2||adjusted.phases[0].end_date!==nextAt||adjusted.phases[1].start_date!==nextAt||adjusted.phases[1].end_date!==endAt||!adjusted.phases.every(validItems))throw Error('Remaining instalment dates were not confirmed.');
   }
   if(!supportedPaymentPromise(binding.offerVersion,binding.offer))throw Error('Historical initial purchase requires its recorded reconciliation.');
   return {initial:{...common,name:binding.name,offer:binding.offer,billing:'instalments',offerVersion:binding.offerVersion,start:settledAt.slice(0,10),enrolledAt:settledAt,currency:'USD',amountPaidMinor:terms.instalment*100,settled:true,initialPayment:true,scheduleVerified:true}};
  }
  return {lifecycle:{...common,kind:'paid',currency:'USD',amountPaidMinor:terms.instalment*100,schedulePaymentCount:terms.payments,settledAt}};
 };
}

