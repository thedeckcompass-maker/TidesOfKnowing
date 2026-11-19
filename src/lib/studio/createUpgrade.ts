import type {ProgrammePayment} from './paymentEntitlements';
export type UpgradeAgreement={reference:string;approvedBy:string;approvedAt:string;adjustment:'credit'|'refund';amountMinor:number;currency:'USD';quoteId:string};
/** Trusted server hooks must retrieve Stripe state, verify ownership and supply idempotent
 * operations. This coordinator never accepts browser-supplied amounts or cancels an account. */
export function prepareCreateUpgrade(config:{adminId:string;
 inspect:(ownerId:string,subscriptionId:string)=>Promise<{ownerId:string;subscriptionId:string;quoteId:string;unusedPrepaidMinor:number;currency:'USD';verified:true}>;
 stopRenewals:(subscriptionId:string,key:string)=>Promise<{subscriptionId:string;renewalsStopped:true;verified:true}>;
 adjust:(subscriptionId:string,agreement:UpgradeAgreement,key:string)=>Promise<{id:string;amountMinor:number;kind:'credit'|'refund';verified:true}>;
}){
 return async(ownerId:string,purchaseId:string,subscriptionId:string,agreement:UpgradeAgreement):Promise<NonNullable<ProgrammePayment['upgrade']>>=>{
  if(agreement.approvedBy!==config.adminId||!agreement.reference?.trim()||!Number.isFinite(Date.parse(agreement.approvedAt))||!['credit','refund'].includes(agreement.adjustment)||!Number.isSafeInteger(agreement.amountMinor)||agreement.amountMinor<0||agreement.currency!=='USD')throw Error('Documented administrator-approved prepaid adjustment required.');
  const quote=await config.inspect(ownerId,subscriptionId);
  if(quote.verified!==true||quote.ownerId!==ownerId||quote.subscriptionId!==subscriptionId||quote.quoteId!==agreement.quoteId||quote.unusedPrepaidMinor!==agreement.amountMinor||quote.currency!==agreement.currency)throw Error('Approved adjustment differs from the verified unused prepaid value.');
  const key='studio-upgrade:'+purchaseId+':'+subscriptionId;
  const stopped=await config.stopRenewals(subscriptionId,key+':stop');
  if(stopped.verified!==true||stopped.subscriptionId!==subscriptionId||stopped.renewalsStopped!==true)throw Error('Existing Create renewals must stop before upgrade confirmation.');
  const adjustment=await config.adjust(subscriptionId,agreement,key+':adjust');
  if(adjustment.verified!==true||!adjustment.id||adjustment.amountMinor!==agreement.amountMinor||adjustment.kind!==agreement.adjustment)throw Error('Prepaid adjustment is not confirmed. Retain the same retry key.');
  return {...agreement,priorSubscriptionId:subscriptionId,renewalsStopped:true,providerAdjustmentId:adjustment.id,automaticResume:false};
 };
}
