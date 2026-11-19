import {prepareAtomicBillingRepository} from './atomicBillingRepository';
import {prepareEnrolmentFulfilment,type VerifiedEnrolment} from './enrolmentFulfilment';
import {prepareEnrolmentLifecycle,type VerifiedLifecycle} from './enrolmentLifecycle';
/** Trusted server composition: signature/provider verification precedes every database mutation. */
export function prepareStudioBilling(config:{adminId:string;rpc:Parameters<typeof prepareAtomicBillingRepository>[0]['rpc'];verify:(request:Request)=>Promise<{initial:VerifiedEnrolment}|{lifecycle:VerifiedLifecycle}|{acknowledged:{saved:true;unchanged:true;replayed:true}|{ignored:true}}>;now?:()=>Date}){
 return async(request:Request)=>{
  const verified=await config.verify(request);
  if('acknowledged' in verified)return verified.acknowledged;
  const repository=(ownerId:string)=>prepareAtomicBillingRepository({ownerId,rpc:config.rpc,now:config.now});
  if('initial' in verified)return prepareEnrolmentFulfilment({enabled:true,adminId:config.adminId,verify:async()=>verified.initial,repository})(request);
  return prepareEnrolmentLifecycle({enabled:true,adminId:config.adminId,verify:async()=>verified.lifecycle,repository})(request);
 };
}
