import {projectPaidAccess,type BillingSlice} from './billingAccess';
import type {ServiceRepository,ServiceTransaction} from './serviceRecordProvider';
type Rpc=(name:string,args:{p:Record<string,unknown>})=>Promise<{data:any;error:any}>;
/** A trusted server client invokes the guarded database RPC. No human identity is impersonated.
 * Business handlers and paid access are committed together, or neither is committed. */
export function prepareAtomicBillingRepository(config:{ownerId:string;rpc:Rpc;now?:()=>Date}):ServiceRepository{
 return {async transaction<T>(work:(tx:ServiceTransaction)=>T):Promise<T>{
  const call=async(p:Record<string,unknown>)=>{const response=await config.rpc('studio_apply_verified_billing_v1',{p});if(response.error||!response.data)throw Error('Atomic billing operation rejected. Retain the event and retry; do not charge again.');return response.data;};
  const original:BillingSlice & {profile?:{id:string;status:string;role:string};groups?:any[]}=await call({operation:'inspect',ownerId:config.ownerId});
  if(original.ownerId!==config.ownerId||original.profile?.id!==config.ownerId||original.profile.status!=='active'||original.profile.role!=='member')throw Error('Verified billing owner unavailable.');
  let state={entries:structuredClone(original.entries),enrolmentIntents:structuredClone(original.enrolmentIntents),groups:structuredClone(original.groups??[]),billingReceipts:structuredClone(original.receipts)},receipt:{key:string;payload:string;result:any}|undefined;
  const forbidden=()=>{throw Error('Billing cannot mutate editorial content or read private source material.');};
  const tx:ServiceTransaction={billingAuthority:'verified-rpc',load:()=>state,save:value=>{state=value;},profile:id=>id===config.ownerId?original.profile!:null,source:forbidden,sources:forbidden,request:forbidden,putRequest:forbidden,replies:forbidden,putReply:forbidden,
   receipt:(_actor,key)=>original.receipts.find(r=>r.key===key)??null,
   putReceipt:(_actor,key,payload,result)=>{if(receipt)throw Error('One verified billing event per atomic transaction.');receipt={key,payload,result};}};
  const business=work(tx);if(business&&typeof (business as any).then==='function')throw Error('Billing reduction must be synchronous.');
  if(!receipt)return business; // Existing receipt: business handler already checked its payload.
  if(JSON.stringify(state.groups)!==JSON.stringify(original.groups??[]))throw Error('Billing cannot rewrite group attendance.');
  const plan=projectPaidAccess({...original,entries:state.entries,enrolmentIntents:state.enrolmentIntents},receipt.key,receipt.payload,(config.now??(()=>new Date()))());
  const result={...receipt.result,...plan.result,accessActivated:true};
  const committed=await call({operation:'commit',ownerId:config.ownerId,receiptKey:receipt.key,payload:receipt.payload,revision:original.revision,expectedAccessVersion:original.access?.updated_at??null,slice:plan.slice,result});
  if(!committed.result)throw Error('Missing billing result: inspect the receipt before retrying.');return committed.result as T;
 }};
}
/** Invoke from an authenticated server scheduler with known enrolled owners, never a public URL. */
export function prepareBillingExpiry(config:{rpc:Rpc;now?:()=>Date}){
 return async(ownerId:string,runId:string)=>{
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(runId))throw Error('Stable scheduler run identity required.');
  return prepareAtomicBillingRepository({ownerId,...config}).transaction(tx=>{
   const state=tx.load(),relevant=state.entries.filter((e:any)=>e.payment?.failures?.length||e.payment?.refund||e.payment?.terminatedAt);
   if(!relevant.length)return {unchanged:true};
   const key='policy:'+runId,payload=JSON.stringify(relevant.map((e:any)=>({id:e.id,payment:e.payment}))),prior=tx.receipt('',key);
   if(prior)return {...prior.result,unchanged:true};
   tx.putReceipt('',key,payload,{saved:true,source:'approved-expiry-policy'});return {saved:true};
  });
 };
}
