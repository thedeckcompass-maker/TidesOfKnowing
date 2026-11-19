import {billingModeEnabled,stripeModeMismatch,type BillingMode} from './billingMode';
import type Stripe from 'stripe';
import { OFFER_VERSION, LEGACY_OFFER_VERSION, STANDARD_OFFERS, newPurchaseOfferVersion, supportedPaymentPromise } from './serviceOffers';
import { servicePurchase } from './servicePurchase';
import type { VerifiedEnrolment } from './enrolmentFulfilment';

export type StudioPriceCatalog = Readonly<Record<string, string>>;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
/** Server-owned selection. Browser-supplied amounts, price IDs and return URLs are never used. */
export function studioCheckoutParameters(input: { ownerId: string; offer: string; billing: string; origin: string }, prices: StudioPriceCatalog): Stripe.Checkout.SessionCreateParams {
  const choice = servicePurchase(input.offer, input.billing);
  const origin = new URL(input.origin);
  if (!choice || !uuid.test(input.ownerId) || origin.origin !== input.origin || origin.protocol !== 'https:') throw Error('Invalid Studio checkout selection.');
  // Three-payment plans require the verified schedule/lifecycle adapter; never create an unbounded subscription.
  if (choice.billing === 'instalments') throw Error('Fixed instalment checkout requires the approved fixed-payment schedule connection.');
  const price = prices[`${choice.offer}:${choice.billing}`];
  if (!price || !/^price_[A-Za-z0-9_]+$/.test(price)) throw Error('Studio price configuration is incomplete.');
  const metadata = { studio_offer_version: newPurchaseOfferVersion(choice.offer), studio_owner_id: input.ownerId, studio_offer: choice.offer, studio_billing: choice.billing };
  return { mode: choice.offer === 'create' ? 'subscription' : 'payment', client_reference_id: input.ownerId,
    line_items: [{ price, quantity: 1 }], metadata, allow_promotion_codes: false,
    ...(choice.offer === 'create' ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    success_url: `${origin.origin}/studio/account/?checkout=received`, cancel_url: `${origin.origin}/deck-creator-studio/checkout/?offer=${choice.offer}&billing=${choice.billing}` };
}

const objectId = (value: unknown): string | null => typeof value === 'string' ? value : value && typeof value === 'object' && 'id' in value && typeof value.id === 'string' ? value.id : null;
const day = (timestamp: number) => { if (!Number.isSafeInteger(timestamp) || timestamp <= 0) throw Error('Verified payment time is missing.'); return new Date(timestamp * 1000).toISOString().slice(0,10); };
/** Adapter for the EXISTING prepareEnrolmentFulfilment verifier hook. No database writes or grants. */
export function prepareStripeEnrolmentVerifier(config: { stripe: Stripe; webhookSecret: string; prices: StudioPriceCatalog; testMode: boolean;productionRelease?:string }) {
  return async (request: Request): Promise<VerifiedEnrolment> => {
    if (!billingModeEnabled(config) || !config.webhookSecret.startsWith('whsec_')) throw Error('Test-mode webhook verification is not configured.');
    const signature = request.headers.get('stripe-signature');
    if (!signature) throw Error('Webhook signature required.');
    const raw = await request.text();
    if (raw.length > 1_000_000) throw Error('Webhook payload exceeds the supported limit.');
    const event = await config.stripe.webhooks.constructEventAsync(raw, signature, config.webhookSecret);
    if (stripeModeMismatch(config,event) || !['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) throw Error('Unsupported Studio enrolment event.');
    const id = objectId(event.data.object);
    if (!id || !id.startsWith(config.testMode?'cs_test_':'cs_live_')) throw Error('Test Checkout session required.');
    const session = await config.stripe.checkout.sessions.retrieve(id);
    const m = session.metadata ?? {}, choice = servicePurchase(m.studio_offer, m.studio_billing);
    if (session.id !== id || stripeModeMismatch(config,session) || session.status !== 'complete' || session.payment_status !== 'paid' || !choice || choice.billing === 'instalments' ||
        !supportedPaymentPromise(m.studio_offer_version??'',choice.offer) || !uuid.test(m.studio_owner_id ?? '') || session.client_reference_id !== m.studio_owner_id ||
        session.mode !== (choice.offer === 'create' ? 'subscription' : 'payment')) throw Error('Studio purchase identity or payment is unverified.');
    const expected = choice.offer === 'create' ? (choice.billing === 'monthly' ? STANDARD_OFFERS.create.monthly : STANDARD_OFFERS.create.annual) * 100 : STANDARD_OFFERS[choice.offer as 'collaborate'|'develop'].price * 100;
    const price = config.prices[`${choice.offer}:${choice.billing}`];
    const lines = await config.stripe.checkout.sessions.listLineItems(id, { limit: 2 });
    if (!price || lines.has_more || lines.data.length !== 1 || lines.data[0].quantity !== 1 || lines.data[0].price?.id !== price ||
        lines.data[0].price?.unit_amount !== expected || lines.data[0].price?.currency !== 'usd' ||
        session.currency !== 'usd' || session.amount_subtotal !== expected || session.amount_total !== expected ||
        (session.total_details?.amount_discount ?? 0) !== 0 || (session.total_details?.amount_tax ?? 0) !== 0 || (session.total_details?.amount_shipping ?? 0) !== 0) throw Error('Studio price does not match the approved offer.');
    let paidAt: number, createPeriodEnds: string | undefined, subscriptionId: string | undefined, initialInvoiceId: string | undefined, paidPeriod: VerifiedEnrolment['paidPeriod'];
    if (choice.offer === 'create') {
      const invoiceId = objectId(session.invoice);
      subscriptionId = objectId(session.subscription) ?? undefined;
      if (!invoiceId || !subscriptionId?.startsWith('sub_')) throw Error('Initial subscription and invoice required.');
      initialInvoiceId = invoiceId;
      const invoice = await config.stripe.invoices.retrieve(invoiceId);
      if (stripeModeMismatch(config,invoice) || invoice.status !== 'paid' || invoice.billing_reason !== 'subscription_create' || invoice.currency !== 'usd' || invoice.amount_paid !== expected || !invoice.status_transitions.paid_at || invoice.lines.has_more || invoice.lines.data.length !== 1) throw Error('Initial paid subscription period is unverified.');
      paidAt = invoice.status_transitions.paid_at;
      const period = invoice.lines.data[0].period;
      if (period.end <= paidAt || period.start > paidAt) throw Error('Initial subscription period is invalid.');
      createPeriodEnds = day(period.end);
      paidPeriod = { startsAt: new Date(period.start * 1000).toISOString(), endsAt: new Date(period.end * 1000).toISOString() };
    } else {
      const paymentId = objectId(session.payment_intent);
      if (!paymentId) throw Error('Successful programme payment required.');
      const payment = await config.stripe.paymentIntents.retrieve(paymentId, { expand: ['latest_charge'] });
      const charge = payment.latest_charge;
      if (stripeModeMismatch(config,payment) || payment.status !== 'succeeded' || payment.currency !== 'usd' || payment.amount_received !== expected || !charge || typeof charge === 'string' || !charge.paid || !charge.captured || charge.refunded || charge.amount_refunded !== 0 || charge.amount !== expected || charge.currency !== 'usd' || charge.disputed) throw Error('Programme payment has not settled.');
      paidAt = charge.created;
    }
    const name = session.customer_details?.name?.trim();
    if (!name || name.length > 200) throw Error('Verified purchaser name required.');
    return {eventId:event.id,purchaseId:session.id,ownerId:m.studio_owner_id,name,offer:choice.offer as VerifiedEnrolment['offer'],billing:choice.billing as VerifiedEnrolment['billing'],offerVersion:m.studio_offer_version!,checkoutRequestId:m.studio_purchase_id,start:day(paidAt),enrolledAt:new Date(paidAt*1000).toISOString(),currency:'USD',amountPaidMinor:expected,verified:true,settled:true,initialPayment:true,...(createPeriodEnds?{createPeriodEnds,paidPeriod,subscriptionId,invoiceId:initialInvoiceId}:{})};
  };
}

/** Test-only initiation. Caller supplies authenticated identity; never expose this factory directly to a browser. */
export function prepareStudioCheckout(config: { stripe: Stripe; prices: StudioPriceCatalog; origin: string; testMode: boolean;productionRelease?:string }) {
  return async (ownerId: string, offer: string, billing: string, retryKey: string, customerId?:string) => {
    if (!billingModeEnabled(config) || !/^[a-zA-Z0-9_-]{16,80}$/.test(retryKey)) throw Error('A stable checkout retry key is required.');
    const params = studioCheckoutParameters({ownerId,offer,billing,origin:config.origin},config.prices);
    if(customerId){if(!/^cus_[A-Za-z0-9_]+$/.test(customerId))throw Error('Verified customer required.');params.customer=customerId;}
    const purchaseId='studio_'+retryKey;params.metadata={...params.metadata,studio_purchase_id:purchaseId};if(params.subscription_data)params.subscription_data.metadata={...params.subscription_data.metadata,studio_purchase_id:purchaseId};if(params.payment_intent_data)params.payment_intent_data.metadata={...params.payment_intent_data.metadata,studio_purchase_id:purchaseId};
    const price = await config.stripe.prices.retrieve(config.prices[`${offer}:${billing}`]);
    const expected = offer === 'create' ? (billing === 'monthly' ? 1200 : 12000) : STANDARD_OFFERS[offer as 'collaborate'|'develop'].price * 100;
    if (stripeModeMismatch(config,price) || !price.active || price.currency !== 'usd' || price.unit_amount !== expected ||
        (offer === 'create' ? price.recurring?.interval !== (billing === 'monthly' ? 'month' : 'year') || price.recurring?.interval_count !== 1 || price.recurring?.usage_type !== 'licensed' : price.type !== 'one_time')) throw Error('Configured test price does not match the approved offer.');
    const session = await config.stripe.checkout.sessions.create(params,{idempotencyKey:`studio:${ownerId}:${offer}:${billing}:${retryKey}`});
    if (stripeModeMismatch(config,session) || !session.id.startsWith(config.testMode?'cs_test_':'cs_live_') || !session.url || new URL(session.url).origin !== 'https://checkout.stripe.com') throw Error('Test Checkout response could not be verified.');
    return {id:session.id,url:session.url};
  };
}
/** Signed test-mode lifecycle adapter. resolve must read the EXISTING durable enrolment binding;
 * metadata alone never selects an owner or grants access. Unsupported pricing changes fail closed. */
export function prepareStripeLifecycleVerifier(config: {
 stripe: Stripe; webhookSecret:string; prices:StudioPriceCatalog; testMode:boolean;productionRelease?:string;
 resolve:(subscriptionId:string)=>Promise<{ownerId:string;purchaseId:string;offer:'create';billing:'monthly'|'annual'}|null>;
 now?:()=>number;
}) {
 return async(request:Request):Promise<import('./enrolmentLifecycle').VerifiedLifecycle>=>{
  if(!billingModeEnabled(config)||!config.webhookSecret.startsWith('whsec_'))throw Error('Test lifecycle verification is not configured.');
  const signature=request.headers.get('stripe-signature'),raw=await request.text();
  if(!signature||raw.length>1_000_000)throw Error('Signed bounded webhook required.');
  const event=await config.stripe.webhooks.constructEventAsync(raw,signature,config.webhookSecret);
  if(stripeModeMismatch(config,event))throw Error('Live lifecycle processing is disabled.');
  const invoiceEvent=['invoice.paid','invoice.payment_failed'].includes(event.type),subscriptionEvent=['customer.subscription.updated','customer.subscription.deleted'].includes(event.type);
  if(!invoiceEvent&&!subscriptionEvent)throw Error('Lifecycle event requires explicit supported handling.');
  const id=objectId(event.data.object);if(!id)throw Error('Provider object identity required.');
  const invoice=invoiceEvent?await config.stripe.invoices.retrieve(id):null;
  const subscriptionId=invoice?objectId(invoice.parent?.subscription_details?.subscription):id;
  if(!subscriptionId?.startsWith('sub_'))throw Error('Verified subscription identity required.');
  const binding=await config.resolve(subscriptionId);
  if(!binding||binding.offer!=='create'||!uuid.test(binding.ownerId)||!['monthly','annual'].includes(binding.billing))throw Error('Existing verified subscription binding required.');
  const subscription=await config.stripe.subscriptions.retrieve(subscriptionId),priceId=config.prices[`create:${binding.billing}`],expected=(binding.billing==='monthly'?STANDARD_OFFERS.create.monthly:STANDARD_OFFERS.create.annual)*100;
  const item=subscription.items.data[0];
  if(subscription.id!==subscriptionId||stripeModeMismatch(config,subscription)||subscription.metadata.studio_owner_id!==binding.ownerId||subscription.metadata.studio_offer!=='create'||![OFFER_VERSION,LEGACY_OFFER_VERSION].includes(subscription.metadata.studio_offer_version)||subscription.metadata.studio_billing!==binding.billing||subscription.items.has_more||subscription.items.data.length!==1||item.quantity!==1||item.price.id!==priceId||item.price.currency!=='usd'||item.price.unit_amount!==expected||item.price.recurring?.interval!==(binding.billing==='monthly'?'month':'year')||item.price.recurring.interval_count!==1)throw Error('Subscription no longer matches its verified offer.');
  const common={verified:true as const,eventId:event.id,purchaseId:binding.purchaseId,ownerId:binding.ownerId,subscriptionId,observedAt:(config.now??Date.now)()};
  if(invoice){
   const line=invoice.lines.data[0];
   if(invoice.id!==id||stripeModeMismatch(config,invoice)||objectId(invoice.customer)!==objectId(subscription.customer)||invoice.currency!=='usd'||invoice.lines.has_more||invoice.lines.data.length!==1||line.quantity!==1||line.pricing?.price_details?.price!==priceId||line.parent?.subscription_item_details?.proration!==false||invoice.amount_due!==expected)throw Error('Invoice ownership, price or period is unverified.');
   if(event.type==='invoice.payment_failed'){
    if(invoice.status!=='open'||invoice.amount_paid!==0||invoice.attempted!==true)throw Error('Failed-payment event is no longer current.');
    return {...common,kind:'payment-failed'};
   }
   if(invoice.status!=='paid'||invoice.amount_paid!==expected||!invoice.status_transitions.paid_at||line.period.end<=line.period.start)throw Error('Paid invoice is unverified.');
   return {...common,kind:'paid',invoiceId:invoice.id,currency:'USD',amountPaidMinor:expected,periodStart:day(line.period.start),periodEnd:day(line.period.end),paidPeriod:{startsAt:new Date(line.period.start*1000).toISOString(),endsAt:new Date(line.period.end*1000).toISOString()}};
  }
  if(subscription.status==='canceled')return {...common,kind:'ended'};
  if(subscription.cancel_at_period_end===true)return {...common,kind:'cancel-at-period-end'};
  throw Error('Subscription update requires another verified lifecycle operation.');
 };
}
/** Pure test-mode schedule preparation: no Stripe call, existing subscription update or default cadence.
 * owner/customer binding, first payment date and cadence must come from trusted approved configuration. */
export function studioInstalmentScheduleParameters(input:{
 ownerId:string;customerId:string;offer:'collaborate'|'develop';startAt:number;
 approvedCadence?:{interval:'week'|'month'|'year';intervalCount:number};
},price:Stripe.Price,config:BillingMode={testMode:true}):Stripe.SubscriptionScheduleCreateParams {
 const cadence=input.approvedCadence??{interval:'month' as const,intervalCount:1},offer=STANDARD_OFFERS[input.offer];
 if(!uuid.test(input.ownerId)||!/^cus_[A-Za-z0-9_]+$/.test(input.customerId)||!offer||!['collaborate','develop'].includes(input.offer)||!Number.isSafeInteger(input.startAt)||input.startAt<=0||!cadence||cadence.interval!=='month'||cadence.intervalCount!==1||!Number.isSafeInteger(cadence.intervalCount)||cadence.intervalCount<1)throw Error('Approved owner, customer, first payment date and instalment cadence are required.');
 if(stripeModeMismatch(config,price)||!price.active||price.currency!=='usd'||price.unit_amount!==offer.instalment*100||price.recurring?.interval!==cadence.interval||price.recurring.interval_count!==cadence.intervalCount||price.recurring.usage_type!=='licensed')throw Error('Test instalment price does not match the approved offer and cadence.');
 const metadata={studio_owner_id:input.ownerId,studio_offer:input.offer,studio_billing:'instalments',studio_offer_version:newPurchaseOfferVersion(input.offer),studio_payment_count:String(offer.payments)};
 return {customer:input.customerId,start_date:input.startAt,end_behavior:'cancel',metadata,
  phases:[{items:[{price:price.id,quantity:1}],duration:{interval:cadence.interval,interval_count:cadence.intervalCount*offer.payments},metadata,proration_behavior:'none'}]};
}
