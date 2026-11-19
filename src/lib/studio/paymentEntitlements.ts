import {INITIAL_UNLOCK_DEVELOP_VERSION,supportedPaymentPromise,STANDARD_OFFERS,addCalendarMonths} from './serviceOffers';
export type ReleaseStage={payments:number;consultations:number;reviews:number};
export type ReleaseAgreement={reference:string;approvedBy:string;approvedAt:string;stages:ReleaseStage[]};
export type RefundAgreement={kind:'full'|'partial';reference:string;approvedBy:string;approvedAt:string;createEndsAt?:string;consultations?:number;reviews?:number;groups?:number};
export type ProgrammePayment={billing:'once'|'instalments';enrolledAt:string;requiredPayments:number;paidInvoiceIds:string[];failures:{invoiceId:string;failedAt:string}[];releaseAgreement?:ReleaseAgreement;releaseHistory?:ReleaseAgreement[];refund?:RefundAgreement;terminatedAt?:string;upgrade?:{reference:string;approvedBy:string;approvedAt:string;priorSubscriptionId:string;renewalsStopped:true;adjustment:'credit'|'refund';amountMinor:number;currency:'USD';providerAdjustmentId:string;automaticResume:false}};
export const POLICY_VERSION='2026-10-31-final';
const day=86400000;
export function instant(value:string){const n=Date.parse(value);if(!Number.isFinite(n)||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value))throw Error('A verified UTC timestamp is required.');return n;}
export function calendarMonthsAt(value:string,months:number){instant(value);return addCalendarMonths(value.slice(0,10),months)+value.slice(10);}
export function validateReleaseAgreement(offer:'collaborate'|'develop',agreement:ReleaseAgreement,adminId:string){
 const terms=STANDARD_OFFERS[offer];
 if(!agreement||agreement.approvedBy!==adminId||!agreement.reference?.trim()||agreement.reference.length>300)throw Error('An explicit administrator-approved release agreement is required.');instant(agreement.approvedAt);
 if(!Array.isArray(agreement.stages)||agreement.stages.length!==terms.payments)throw Error('Record a cumulative release for every payment stage.');
 let c=0,r=0;
 for(let n=1;n<=terms.payments;n++){const s=agreement.stages[n-1];if(s.payments!==n||!Number.isSafeInteger(s.consultations)||!Number.isSafeInteger(s.reviews)||s.consultations<c||s.reviews<r||s.consultations>terms.consultations||s.reviews>terms.assessments)throw Error('Payment stages must be cumulative and within the purchased allocation.');if(n<terms.payments&&s.consultations===terms.consultations&&s.reviews===terms.assessments)throw Error('The entire individual allocation cannot be released before final payment.');c=s.consultations;r=s.reviews;}
 if(c!==terms.consultations||r!==terms.assessments)throw Error('Final payment must release the entire purchased allocation.');return structuredClone(agreement);
}
/** Derived permissions only; never delete content, delivered work, accounts or historical promises. */
export function programmeAvailability(entry:any,now=Date.now()){
 const p:ProgrammePayment|undefined=entry.payment,benefits=entry.promise.benefits;
 const initialUnlock=entry.promise.version===INITIAL_UNLOCK_DEVELOP_VERSION;
 if(initialUnlock&&(entry.promise.programme!=='develop'||!p||!Array.isArray(p.paidInvoiceIds)||p.paidInvoiceIds.length===0))return {state:'awaiting-payment',createEndsAt:null,editorial:false,groups:0,consultations:0,reviews:0,releasePending:true};
 if(!supportedPaymentPromise(entry.promise.version,entry.promise.programme)||!p)return {state:'legacy' as string,createEndsAt:null as string|null,editorial:true,groups:benefits.groups,consultations:benefits.consultations,reviews:benefits.assessments,releasePending:false};
 const enrolled=instant(p.enrolledAt),normalEnd=calendarMonthsAt(p.enrolledAt,12),editorialEnd=instant(calendarMonthsAt(p.enrolledAt,6));
 let state='active',createEndsAt=normalEnd,editorial=now>=enrolled&&now<editorialEnd;
 if(p.refund?.kind==='full'){state='refunded';editorial=false;createEndsAt=p.refund.approvedAt;}
 else if(p.terminatedAt){state='terminated';editorial=false;createEndsAt=p.terminatedAt;}
 else if(p.failures.length){const failed=Math.min(...p.failures.map(f=>instant(f.failedAt)));if(now>=failed+21*day){state='terminated';editorial=false;createEndsAt=new Date(failed+21*day).toISOString();}else if(now>=failed+7*day){state='resolution';editorial=false;}else state='grace';}
 if(p.refund?.kind==='partial'){createEndsAt=p.refund.createEndsAt!;editorial=editorial&&now<instant(createEndsAt);}
 let consultations=benefits.consultations,reviews=benefits.assessments,groups=benefits.groups,releasePending=false;
 if(!initialUnlock&&p.billing==='instalments'&&p.paidInvoiceIds.length<p.requiredPayments){const stage=p.releaseAgreement?.stages.find(s=>s.payments===p.paidInvoiceIds.length);consultations=stage?.consultations??0;reviews=stage?.reviews??0;releasePending=!stage;}
 if(p.refund?.kind==='partial'){consultations=Math.min(consultations,p.refund.consultations!);reviews=Math.min(reviews,p.refund.reviews!);groups=Math.min(groups,p.refund.groups!);}
 if(!editorial){consultations=0;reviews=0;groups=0;}
 return {state,createEndsAt,editorial,groups,consultations,reviews,releasePending};
}
export function assertProgrammeAction(entry:any,kind:'group'|'consultation'|'review',now=Date.now()){
 const a=programmeAvailability(entry,now);if(!a.editorial)throw Error('New editorial bookings and deliverables are suspended. Existing work and export rights remain protected.');
 const limit=kind==='group'?a.groups:kind==='consultation'?a.consultations:a.reviews;
 if(limit<1)throw Error(a.releasePending?'The administrator must record the agreed payment-stage release before individual editorial work is available.':'This service is not available at the current payment stage.');return limit;
}
export function approveRefund(entry:any,agreement:RefundAgreement,adminId:string){
 if(!entry.payment||agreement.approvedBy!==adminId||!agreement.reference?.trim()||!['full','partial'].includes(agreement.kind))throw Error('An explicit approved refund agreement is required.');instant(agreement.approvedAt);
 if(agreement.kind==='partial'){
  if(!agreement.createEndsAt)throw Error('Record the agreed retained Create end date.');instant(agreement.createEndsAt);
  for(const [key,max,used]of [['consultations',entry.promise.benefits.consultations,entry.consultations.filter((c:any)=>c.status==='completed').length],['reviews',entry.promise.benefits.assessments,entry.reviews.filter((r:any)=>r.status==='delivered').length],['groups',entry.promise.benefits.groups,0]] as const){const v=agreement[key];if(!Number.isSafeInteger(v)||v!<used||v!>max)throw Error('Refund allocation must preserve delivered work and remain within the purchase.');}
 }
 entry.payment.refund=structuredClone(agreement);
}
