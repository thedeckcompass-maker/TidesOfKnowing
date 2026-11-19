import {projectPaidAccess,type BillingSlice} from './billingAccess';
/** Server-only injected client; never create credentials here or expose this adapter in a browser.
 * The reviewed RPC must be installed and permission-tested before runtime activation. */
export function prepareBillingRpc(config:{rpc:(name:string,args:{p:Record<string,unknown>})=>Promise<{data:any;error:any}>;now?:()=>Date}){
 return async(ownerId:string,receiptKey:string,payload:string,change:(slice:BillingSlice)=>BillingSlice)=>{
  const call=async(p:Record<string,unknown>)=>{const response=await config.rpc('studio_apply_verified_billing_v1',{p});if(response.error||!response.data)throw Error('Atomic billing operation was not accepted. No new payment should be created.');return response.data;};
  const original:BillingSlice=await call({operation:'inspect',ownerId});
  if(original.ownerId!==ownerId||!original.revision||!Array.isArray(original.receipts))throw Error('Invalid owner billing snapshot.');
  const prior=original.receipts.find(r=>r.key===receiptKey);if(prior){if(prior.payload!==payload)throw Error('Billing event conflict.');return {...prior.result,unchanged:true};}
  const changed=change(structuredClone(original));
  if(changed.ownerId!==ownerId)throw Error('Billing owner cannot change.');
  const plan=projectPaidAccess(changed,receiptKey,payload,(config.now??(()=>new Date()))());
  const committed=await call({operation:'commit',ownerId,receiptKey,payload,revision:original.revision,expectedAccessVersion:original.access?.updated_at??null,slice:plan.slice,result:plan.result});
  if(!committed.result)throw Error('Atomic billing result missing; inspect receipt before retrying.');return committed.result;
 };
}
