import {supportedPaymentPromise,offersForVersion,addCalendarMonths} from './serviceOffers';
import {instant,programmeAvailability,approveRefund,type RefundAgreement} from './paymentEntitlements';
import type {ServiceRepository} from './serviceRecordProvider';
export type VerifiedLifecycle={verified:true;eventId:string;purchaseId:string;ownerId:string;subscriptionId?:string;observedAt:number;kind:'paid'|'payment-failed'|'cancel-at-period-end'|'ended'|'refund'|'dispute';invoiceId?:string;currency?:'USD';amountPaidMinor?:number;periodStart?:string;periodEnd?:string;schedulePaymentCount?:number;paidPeriod?:{startsAt:string;endsAt:string};failedAt?:string;settledAt?:string;refundVerified?:boolean;refundAgreement?:RefundAgreement};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const reference=(s:unknown):s is string=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(s);
/** Existing ledger transaction only. The separate guarded materializer must commit access+receipt.
 * Browser bodies never construct verified evidence. Account/content rows are never modified here. */
export function prepareEnrolmentLifecycle(config:{enabled?:boolean;adminId:string;verify:(r:Request)=>Promise<VerifiedLifecycle>;repository:(owner:string)=>ServiceRepository}){
 return async(request:Request)=>{
  if(config.enabled!==true)throw Error('Enrolment lifecycle is inactive.');const e=await config.verify(request);
  if(e?.verified!==true||!uuid.test(e.ownerId)||![e.eventId,e.purchaseId].every(reference)||(e.subscriptionId!==undefined&&!reference(e.subscriptionId))||!Number.isSafeInteger(e.observedAt)||e.observedAt<=0||!['paid','payment-failed','cancel-at-period-end','ended','refund','dispute'].includes(e.kind))throw Error('Verified lifecycle evidence is incomplete.');
  // Observation time is not event identity: webhook retries may be retrieved at a later time.
  const payload=JSON.stringify([e.purchaseId,e.ownerId,e.subscriptionId??null,e.kind,e.invoiceId??null,e.currency??null,e.amountPaidMinor??null,e.periodStart??null,e.periodEnd??null,e.schedulePaymentCount??null,e.paidPeriod??null,e.failedAt??null,e.settledAt??null,e.refundAgreement??null]);
  return config.repository(e.ownerId).transaction(tx=>{
   const admin=tx.profile(config.adminId),owner=tx.profile(e.ownerId);if((tx.billingAuthority!=='verified-rpc'&&(admin?.id!==config.adminId||admin.role!=='admin'||admin.status!=='active'))||owner?.id!==e.ownerId||owner.status!=='active'||owner.role!=='member')throw Error('Verified lifecycle accounts are unavailable.');
   const key='lifecycle:'+e.eventId,prior=tx.receipt(config.adminId,key);if(prior){if(prior.payload!==payload)throw Error('Lifecycle event conflicts with its first receipt.');return {...prior.result,unchanged:true};}
   const state=tx.load(),matches=state?.enrolmentIntents?.filter((i:any)=>i.purchaseId===e.purchaseId);if(matches?.length!==1)throw Error('Exactly one existing verified enrolment is required.');
   const i=matches[0],entry=state.entries?.find((v:any)=>v.id===i.id),catalog=offersForVersion(i.promise?.version);
   if(i.ownerId!==e.ownerId||entry?.ownerId!==e.ownerId||(i.subscriptionId??null)!==(e.subscriptionId??null)||!['create','collaborate','develop'].includes(i.offer)||i.promise.programme!==i.offer)throw Error('Lifecycle ownership or original offer could not be verified.');
   const done=(result:Record<string,unknown>)=>{tx.putReceipt(config.adminId,key,payload,result);return result;};
   if(i.lifecycle?.observedAt>e.observedAt)return done({saved:true,ignored:true,reason:'older-observation',accessActivated:false});
   if(i.lifecycle?.observedAt===e.observedAt&&i.lifecycle?.eventId!==e.eventId)throw Error('Concurrent provider observations need a fresh authoritative read.');
   const p=entry.payment,newProgramme=supportedPaymentPromise(i.promise.version,i.offer)&&i.offer!=='create';
   if(newProgramme&&!p)throw Error('Recorded programme payment provenance is required.');
   if(i.lifecycle?.reviewRequired&&!['refund','dispute'].includes(e.kind))throw Error('This payment needs an explicit reviewed resolution.');
   let scheduleComplete=false;
   if(e.kind==='paid'){
    if(!reference(e.invoiceId)||e.currency!=='USD'||!Array.isArray(i.paidInvoiceIds))throw Error('A verified paid invoice is required.');const create=i.offer==='create';
    if(create&&!['monthly','annual'].includes(i.billing)||!create&&i.billing!=='instalments')throw Error('This enrolment has no recurring invoice contract.');
    const terms=catalog[i.offer as 'create'|'collaborate'|'develop'];const expected=create?(i.billing==='monthly'?catalog.create.monthly:catalog.create.annual)*100:('instalment' in terms?terms.instalment:0)*100;const count=create?1000:('payments' in terms?terms.payments:0);
    if(e.amountPaidMinor!==expected||!create&&e.schedulePaymentCount!==count)throw Error('Paid invoice or fixed schedule does not match the recorded offer.');
    const duplicate=i.paidInvoiceIds.includes(e.invoiceId);
    if(!duplicate){if(i.paidInvoiceIds.length>=count)throw Error('Invoice limit reached; do not collect another payment.');
     if(create){if(!e.periodStart||!e.periodEnd||!e.paidPeriod)throw Error('Verified exact paid period required.');addCalendarMonths(e.periodStart,0);addCalendarMonths(e.periodEnd,0);if(e.periodStart>=e.periodEnd||e.periodEnd<=i.promise.createEnds||instant(e.paidPeriod.startsAt)>=instant(e.paidPeriod.endsAt)||e.paidPeriod.startsAt.slice(0,10)!==e.periodStart||e.paidPeriod.endsAt.slice(0,10)!==e.periodEnd)throw Error('A renewal must extend the verified paid period.');i.promise.createEnds=e.periodEnd;entry.promise.createEnds=e.periodEnd;i.paidPeriods=[...(i.paidPeriods??(i.paidPeriod?[i.paidPeriod]:[])),structuredClone(e.paidPeriod)];i.paidPeriod=structuredClone(e.paidPeriod);}
     i.paidInvoiceIds.push(e.invoiceId);
    }
    if(newProgramme){if(!e.settledAt)throw Error('Verified settlement timestamp required.');const at=instant(e.settledAt);const before=programmeAvailability(entry,at);if(before.state==='terminated')p.terminatedAt=before.createEndsAt;else p.failures=p.failures.filter((f:any)=>f.invoiceId!==e.invoiceId);p.paidInvoiceIds=[...i.paidInvoiceIds];}
    scheduleComplete=!create&&i.paidInvoiceIds.length===count;
   }else if(e.kind==='payment-failed'&&newProgramme){
    if(!reference(e.invoiceId)||!e.failedAt)throw Error('Verified failed invoice and failure timestamp required.');instant(e.failedAt);
    if(!p.paidInvoiceIds.includes(e.invoiceId)){const priorFailure=p.failures.find((f:any)=>f.invoiceId===e.invoiceId);if(!priorFailure)p.failures.push({invoiceId:e.invoiceId,failedAt:e.failedAt});else if(instant(e.failedAt)<instant(priorFailure.failedAt))priorFailure.failedAt=e.failedAt;}
   }else if(e.kind==='refund'&&newProgramme){if(e.refundVerified!==true||!e.refundAgreement)throw Error('Verified refund and documented administrator agreement required.');if(instant(e.refundAgreement.approvedAt)>e.observedAt)throw Error('Refund approval cannot be in the future.');const attended=(state.groups??[]).filter((g:any)=>g.invitations?.some((v:any)=>v.enrolmentId===entry.id&&v.attended)).length;if(e.refundAgreement.kind==='partial'&&e.refundAgreement.groups!<attended)throw Error('Refund agreement must preserve attended groups.');approveRefund(entry,e.refundAgreement,config.adminId);}
   i.lifecycle={observedAt:e.observedAt,eventId:e.eventId,state:e.kind,reviewRequired:e.kind==='dispute'||e.kind==='refund'&&!newProgramme,scheduleComplete};
   if(p)i.payment=structuredClone(p);tx.save(state);
   return done({saved:true,unchanged:false,accessActivated:false,enrolmentId:i.id,createEnds:i.promise.createEnds,editorialEnds:i.promise.editorialEnds,scheduleComplete,reviewRequired:i.lifecycle.reviewRequired,...(newProgramme?{availability:programmeAvailability(entry,e.observedAt)}:{})});
  });
 };
}
