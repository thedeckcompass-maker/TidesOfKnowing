import {supportedPaymentPromise} from './serviceOffers';
import {programmeAvailability,instant} from './paymentEntitlements';
export type AccessRow={user_id:string;phase:'intro'|'paid';onboarding_date:string;time_zone:string;starts_at:string;expires_at:string;revoked_at:string|null;updated_by:string|null;updated_at:string};
export type BillingSlice={ownerId:string;entries:any[];enrolmentIntents:any[];access:AccessRow|null;baseline?:{original:AccessRow|null;projected:AccessRow|null};receipts:{key:string;payload:string;result:any}[];revision:string};
/** The database RPC must atomically compare the revision/access and commit this owner slice only.
 * No profile, manuscript, account-status, capability or other-owner mutation belongs to billing. */
export function projectPaidAccess(slice:BillingSlice,key:string,payload:string,now=new Date()){
 const prior=slice.receipts.find(r=>r.key===key);if(prior){if(prior.payload!==payload)throw Error('Billing receipt conflicts with its original event.');return {slice,result:{...prior.result,unchanged:true}};}
 const next=structuredClone(slice);if(next.access?.user_id!==undefined&&next.access.user_id!==next.ownerId)throw Error('Access owner mismatch.');
 if(next.access?.revoked_at)throw Error('Revoked access requires explicit administrator reconciliation.');
 if(next.baseline&&JSON.stringify(next.baseline.projected)!==JSON.stringify(next.access))throw Error('Manual access changed; preserve it and reconcile before projecting billing.');
 next.baseline??={original:structuredClone(next.access),projected:structuredClone(next.access)};
 const windows:{start:string;end:string;paid?:boolean}[]=[];const original=next.baseline.original;
 if(original&&!original.revoked_at)windows.push({start:original.starts_at,end:original.expires_at,paid:original.phase==='paid'});
 for(const i of next.enrolmentIntents){
  if(i.ownerId!==next.ownerId)throw Error('Foreign billing intent rejected.');
  if(!supportedPaymentPromise(i.promise?.version,i.offer)||i.supersededForAccessBy)continue;
  const entry=next.entries.find(e=>e.id===i.id&&e.ownerId===next.ownerId);if(!entry)throw Error('Billing service record missing.');
  if(i.offer==='create'){if(!i.paidPeriod)throw Error('Exact verified paid period is required.');for(const period of i.paidPeriods??[i.paidPeriod])windows.push({start:period.startsAt,end:period.endsAt,paid:true});}
  else {if(!entry.payment||!entry.payment.paidInvoiceIds.length)throw Error('Successful initial payment required.');const availability=programmeAvailability(entry,now.getTime());const failureEnds=(entry.payment.failures??[]).map((f:any)=>instant(f.failedAt)+21*86400000);const enforcedEnd=new Date(Math.min(instant(availability.createEndsAt!),...failureEnds)).toISOString();windows.push({start:entry.payment.enrolledAt,end:enforcedEnd,paid:true});if(availability.state==='terminated')entry.payment.terminatedAt??=availability.createEndsAt;i.payment=structuredClone(entry.payment);}
 }
 for(const w of windows){instant(w.start);instant(w.end);}
 const active=windows.filter(w=>instant(w.start)<=now.getTime()&&instant(w.end)>now.getTime());
 if(active.length){
  // A single access row cannot represent a gap between disjoint future windows.
  const end=active.reduce((a,b)=>instant(a.end)>instant(b.end)?a:b).end;
  if(original&&instant(original.starts_at)>now.getTime()&&instant(end)<instant(original.starts_at))throw Error('Future manual access needs explicit reconciliation.');
  const start=next.access?.starts_at??active.reduce((a,b)=>instant(a.start)<instant(b.start)?a:b).start;
  next.access={user_id:next.ownerId,phase:active.some(w=>w.paid)?'paid':(next.access?.phase??'intro'),onboarding_date:next.access?.onboarding_date??start.slice(0,10),time_zone:next.access?.time_zone??'UTC',starts_at:start,expires_at:end,revoked_at:null,updated_by:null,updated_at:now.toISOString()};
 }else if(next.access){
  const ends=windows.filter(w=>instant(w.start)<=now.getTime()).map(w=>instant(w.end));const end=ends.length?Math.max(...ends):now.getTime();
  if(end<=instant(next.access.starts_at))throw Error('Access boundary needs explicit reconciliation.');
  next.access={...next.access,expires_at:new Date(end).toISOString(),updated_by:null,updated_at:now.toISOString()};
 }
 next.baseline.projected=structuredClone(next.access);
 const result={saved:true,unchanged:false,tier:active.length?'create':'explore',accessExpiresAt:next.access?.expires_at??null,accountPreserved:true,contentPreserved:true,automaticCreateRenewal:false};
 next.receipts.push({key,payload,result});return {slice:next,result};
}
export function prepareBillingMaterializer(config:{callerRole:'service_role';repository:{transaction<T>(owner:string,work:(slice:BillingSlice)=>{slice:BillingSlice;result:T}):Promise<T>};now?:()=>Date}){
 return async(owner:string,key:string,payload:string)=>{if(config.callerRole!=='service_role'||!/^[a-f0-9-]{36}$/i.test(owner)||!key||key.length>200)throw Error('Trusted billing caller and owner required.');return config.repository.transaction(owner,s=>projectPaidAccess(s,key,payload,(config.now??(()=>new Date()))()));};
}
