import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import Stripe from 'stripe';
const source="export * from './src/lib/studio/serviceOffers.ts';export * from './src/lib/studio/paymentEntitlements.ts';export * from './src/lib/studio/serviceRecords.ts';export * from './src/lib/studio/stripeCheckout.ts';export * from './src/lib/studio/stripeProgramme.ts';export * from './src/lib/studio/enrolmentFulfilment.ts';export * from './src/lib/studio/enrolmentLifecycle.ts';export * from './src/lib/studio/billingAccess.ts';export * from './src/lib/studio/stripePurchaseBindings.ts';";
const built=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});
const module={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
const lib=module.exports,owner='11111111-1111-4111-8111-111111111111',admin='22222222-2222-4222-8222-222222222222',at='2026-11-17T12:00:00Z',now=Date.parse(at)+86400000;
function entry(version=lib.INITIAL_UNLOCK_DEVELOP_VERSION){const store=lib.createServiceRecordStore(admin,[{id:'entry',person:{id:owner,name:'Synthetic'},programme:'develop',start:'2026-11-17'}],()=>new Date(now));const e=store.snapshot().entries[0];e.promise.version=version;e.payment={billing:'instalments',enrolledAt:at,requiredPayments:3,paidInvoiceIds:['in_first'],failures:[]};return e;}

test('new Develop unlocks 4/2 after first paid invoice; historical release agreements remain unchanged',()=>{
 const current=entry(),a=lib.programmeAvailability(current,now);assert.equal(a.consultations,4);assert.equal(a.reviews,2);assert.equal(a.groups,8);assert.equal(a.releasePending,false);
 const historical=entry(lib.OFFER_VERSION);assert.equal(lib.programmeAvailability(historical,now).consultations,0);
 historical.payment.releaseAgreement={stages:[{payments:1,consultations:1,reviews:0}]};assert.equal(lib.programmeAvailability(historical,now).consultations,1);
 current.payment.paidInvoiceIds=[];assert.equal(lib.programmeAvailability(current,now).editorial,false);
 current.payment.paidInvoiceIds=['in_first'];current.promise.programme='collaborate';assert.equal(lib.programmeAvailability(current,now).editorial,false);
});
test('new policy retains failure grace/resolution/termination, refund and six-month service boundaries',()=>{
 const e=entry();e.payment.failures=[{invoiceId:'in_second',failedAt:at}];
 assert.equal(lib.programmeAvailability(e,Date.parse(at)+6*86400000).consultations,4);
 assert.equal(lib.programmeAvailability(e,Date.parse(at)+8*86400000).editorial,false);
 assert.equal(lib.programmeAvailability(e,Date.parse(at)+22*86400000).state,'terminated');
 e.payment.failures=[];e.payment.refund={kind:'full',approvedAt:at};assert.equal(lib.programmeAvailability(e,now).editorial,false);
 delete e.payment.refund;assert.equal(lib.programmeAvailability(e,Date.parse('2027-05-17T12:00:00Z')).editorial,false);
});
test('existing service actions reserve all new allocations with retry/ownership/consumption protection',()=>{
 const e=entry(),store=lib.createServiceRecordStore(admin,[],()=>new Date(now),{entries:[e],groups:[],receipts:[]});
 const act=(action,key,revision)=>({action,key,enrolmentId:e.id,revision});
 for(let n=0;n<4;n++)store.act(owner,act('consultation-request','c'+n,n));
 assert.equal(store.act(owner,act('consultation-request','c3',3)).unchanged,true);
 assert.throws(()=>store.act(owner,act('consultation-request','overflow',4)));
 for(let n=0;n<2;n++)store.act(owner,act('review-request','r'+n,4+n));
 assert.throws(()=>store.act(owner,act('review-request','overflow-review',6)));
 assert.throws(()=>store.act('foreign',act('request-group','foreign',6)));
 assert.throws(()=>store.act(admin,act('release-plan','old-plan',6)),/does not use progressive/);
 assert.equal(store.read(owner).entries[0].consultations.length,4);assert.equal(store.read(owner).entries[0].reviews.length,2);
});
test('new checkout and bounded schedule record a new Develop version without changing price or Create/Collaborate metadata',()=>{
 const p=lib.studioCheckoutParameters({ownerId:owner,offer:'develop',billing:'once',origin:'https://example.invalid'},{'develop:once':'price_develop'});
 assert.equal(p.metadata.studio_offer_version,lib.INITIAL_UNLOCK_DEVELOP_VERSION);
 const price={id:'price_develop',active:true,livemode:false,currency:'usd',unit_amount:52500,recurring:{interval:'month',interval_count:1,usage_type:'licensed'}};
 const schedule=lib.studioInstalmentScheduleParameters({ownerId:owner,customerId:'cus_test',offer:'develop',startAt:Date.parse(at)/1000},price,{testMode:true});
 assert.equal(schedule.metadata.studio_offer_version,lib.INITIAL_UNLOCK_DEVELOP_VERSION);assert.equal(schedule.metadata.studio_payment_count,'3');assert.equal(schedule.end_behavior,'cancel');
 assert.equal(lib.newPurchaseOfferVersion('create'),lib.OFFER_VERSION);assert.equal(lib.newPurchaseOfferVersion('collaborate'),lib.OFFER_VERSION);
});
test('signed invoice -> verified fulfillment -> durable version -> access projection/lifecycle uses actual adapters with mocked Stripe',async()=>{
 const stripe=new Stripe('sk_test_synthetic_no_network'),secret='whsec_synthetic',start=Date.parse(at)/1000;
 const meta={studio_owner_id:owner,studio_offer:'develop',studio_offer_version:lib.INITIAL_UNLOCK_DEVELOP_VERSION,studio_billing:'instalments',studio_payment_count:'3'};
 const invoice={id:'in_first',livemode:false,parent:{subscription_details:{subscription:'sub_test'}},customer:'cus_test',currency:'usd',amount_due:52500,amount_paid:52500,status:'paid',billing_reason:'subscription_create',status_transitions:{paid_at:start},lines:{has_more:false,data:[{quantity:1,pricing:{price_details:{price:'price_develop'}},parent:{subscription_item_details:{proration:false}}}]}};
 stripe.invoices.retrieve=async()=>invoice;
 stripe.subscriptions.retrieve=async()=>({id:'sub_test',livemode:false,customer:'cus_test',metadata:meta,schedule:'sched_test',items:{has_more:false,data:[{quantity:1,price:{id:'price_develop',unit_amount:52500,currency:'usd',recurring:{interval:'month',interval_count:1}}}]}});
 stripe.subscriptionSchedules.retrieve=async()=>({livemode:false,end_behavior:'cancel',metadata:meta,phases:[{start_date:start,end_date:Date.parse('2027-02-17T12:00:00Z')/1000,items:[{price:'price_develop',quantity:1}]}]});
 const verify=lib.prepareProgrammeInvoiceVerifier({stripe,webhookSecret:secret,testMode:true,prices:{'develop:instalments':'price_develop'},resolve:async()=>({ownerId:owner,purchaseId:'purchase_test',name:'Synthetic',offer:'develop',offerVersion:lib.INITIAL_UNLOCK_DEVELOP_VERSION})});
 const payload=JSON.stringify({id:'evt_test',type:'invoice.paid',created:start,livemode:false,data:{object:{id:invoice.id}}});
 const request=()=>new Request('https://example.invalid',{method:'POST',body:payload,headers:{'stripe-signature':stripe.webhooks.generateTestHeaderString({payload,secret})}});
 const evidence=(await verify(request())).initial;assert.equal(evidence.offerVersion,lib.INITIAL_UNLOCK_DEVELOP_VERSION);
 let saved={entries:[],enrolmentIntents:[]};const receipts=new Map();
 const repository={async transaction(work){let draft=structuredClone(saved);const pending=new Map(receipts);const result=work({profile:id=>({id,role:id===admin?'admin':'member',status:'active'}),load:()=>draft,save:v=>{draft=v},receipt:(_actor,key)=>pending.get(key),putReceipt:(_actor,key,payload,result)=>pending.set(key,{payload,result})});saved=draft;for(const [k,v]of pending)receipts.set(k,v);return result;}};
 const fulfill=lib.prepareEnrolmentFulfilment({enabled:true,adminId:admin,verify:async()=>evidence,repository:()=>repository});
 await fulfill(request());assert.equal(saved.entries.length,1);assert.equal(saved.entries[0].promise.version,evidence.offerVersion);assert.equal(lib.programmeAvailability(saved.entries[0],now).consultations,4);
 await fulfill(request());assert.equal(saved.entries.length,1);
 const projection=lib.projectPaidAccess({ownerId:owner,...structuredClone(saved),access:null,receipts:[],revision:'test'},'projection','test',new Date(now));assert.equal(projection.slice.access.phase,'paid');assert.equal(Date.parse(projection.slice.access.expires_at),Date.parse('2027-11-17T12:00:00Z'));
 const lifecycle=lib.prepareEnrolmentLifecycle({enabled:true,adminId:admin,verify:async()=>({verified:true,eventId:'evt_failure',purchaseId:'purchase_test',ownerId:owner,subscriptionId:'sub_test',observedAt:now,kind:'payment-failed',invoiceId:'in_second',failedAt:at}),repository:()=>repository});
 await lifecycle(request());assert.equal(saved.entries[0].payment.failures.length,1);assert.equal(lib.programmeAvailability(saved.entries[0],Date.parse(at)+8*86400000).editorial,false);
});
test('durable schedule initiation and interrupted retries retain their original purchase version',async()=>{
 for(const recordedVersion of [null,lib.OFFER_VERSION]){
  const retryKey='synthetic_purchase_123',purchaseId='studio_'+retryKey,customerId='cus_test',name='Synthetic';
  const purchasePayload=JSON.stringify({ownerId:owner,customerId,offer:'develop',name});
  const receipts=[{key:'customer-binding',payload:owner,result:{customerId}}];
  if(recordedVersion)receipts.push({key:'purchase:'+purchaseId,payload:purchasePayload,result:{purchaseId,ownerId:owner,customerId,name,offer:'develop',offerVersion:recordedVersion,purchasePayload}});
  let slice={ownerId:owner,profile:{id:owner,status:'active',role:'member'},entries:[],enrolmentIntents:[],groups:[],access:null,baseline:null,receipts,revision:'synthetic'};
  const rpc=async(_name,{p})=>{
   if(p.operation==='inspect')return {data:structuredClone(slice),error:null};
   assert.equal(p.operation,'commit');
   slice={...p.slice,profile:slice.profile,groups:[],receipts:[...slice.receipts,{key:p.receiptKey,payload:p.payload,result:p.result}],revision:'synthetic'};
   return {data:{result:p.result},error:null};
  };
  const stripe=new Stripe('sk_test_synthetic_no_network');let created=0;
  stripe.prices.retrieve=async id=>({id,active:true,livemode:false,currency:'usd',unit_amount:id==='price_create'?1200:52500,recurring:{interval:'month',interval_count:1,usage_type:'licensed'}});
  stripe.subscriptionSchedules.list=async()=>({has_more:false,data:[]});
  stripe.subscriptionSchedules.create=async params=>{created++;assert.equal(params.metadata.studio_offer_version,recordedVersion??lib.INITIAL_UNLOCK_DEVELOP_VERSION);assert.equal(params.phases[0].metadata.studio_offer_version,params.metadata.studio_offer_version);return {id:'sched_test',livemode:false,customer:customerId,end_behavior:'cancel',subscription:'sub_test'};};
  const bindings=lib.prepareStripePurchaseBindings({stripe,rpc,testMode:true,prices:{'create:monthly':'price_create','develop:instalments':'price_develop'}});
  const first=await bindings.schedule(owner,customerId,'develop',Date.parse(at)/1000,retryKey,name);
  assert.equal(first.scheduleId,'sched_test');await bindings.schedule(owner,customerId,'develop',Date.parse(at)/1000,retryKey,name);assert.equal(created,1);
  assert.equal(slice.receipts.find(r=>r.key==='purchase:'+purchaseId).result.offerVersion,recordedVersion??lib.INITIAL_UNLOCK_DEVELOP_VERSION);
 }
});

test('review-only atomic SQL preserves old promises and requires independent installed-function review',()=>{
 const sql=fs.readFileSync('docs/DCS-DEVELOP-INITIAL-UNLOCK-20261117.REVIEW.sql','utf8');
 assert.match(sql,/dcs.reviewed_billing_function_md5/);assert.match(sql,/Original programme promise must be preserved/);assert.match(sql,/Verified new purchase cannot fabricate delivered services/);assert.match(sql,/ROLLBACK;\s*$/);
 const undo=fs.readFileSync('docs/DCS-DEVELOP-INITIAL-UNLOCK-20261117.ROLLBACK.review.sql','utf8');assert.match(undo,/New-version purchases exist/);
});
