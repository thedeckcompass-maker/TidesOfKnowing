import {applyQuotation,canonical,quotationTarget} from './quotationEvidence';
import {assertProgrammeAction} from './paymentEntitlements';
import {createServiceRecordStore} from './serviceRecords';
import {selectedPacket,type EditorialSource} from './editorialSnapshots';

export interface ServiceTransaction {
 billingAuthority?:'verified-rpc';
 load():any; save(value:any):void;
 profile(id:string):{id:string;status:string;role:string}|null;
 source(owner:string,project:string,fingerprint:string):EditorialSource|null;
 sources(owner:string):Array<EditorialSource & {projectId:string}>;
 request(id:string):any; putRequest(value:any):void;
 replies(id:string):any[]; putReply(value:any):void;
 receipt(actor:string,key:string):{payload:string;result:any}|null;
 putReceipt(actor:string,key:string,payload:string,result:any):void;
}
export interface ServiceRepository { transaction<T>(work:(tx:ServiceTransaction)=>T,scope?:'ledger-only'|'records-only'):Promise<T> }
export type ServiceProviderConfig={enabled?:boolean;actorId:string;recipientId:string;repository:ServiceRepository;now?:()=>Date};

/** Server-only composition. Repository must lock, validate and commit the entire unit
 * (ledger, request, reply and receipt) or roll all of it back. No hosted default. */
export function prepareServiceRecordProvider(config:ServiceProviderConfig){
 const now=config.now??(()=>new Date());
 function actor(tx:ServiceTransaction,who:string){if(config.enabled!==true||!config.recipientId||who!==config.actorId)throw Error('Service connection is inactive or identity is unverified.');const p=tx.profile(who);if(p?.id!==who||p.status!=='active')throw Error('Current account access is unavailable.');return p;}
 function staff(tx:ServiceTransaction,who:string){const p=actor(tx,who);if(who!==config.recipientId||p.role!=='admin')throw Error('Assigned administrator required.');}
 function active(e:any){const day=now().toISOString().slice(0,10);if(day<e.promise.start||day>=e.promise.editorialEnds)throw Error('This programme is outside its editorial period.');}
 function request(tx:ServiceTransaction,id:string,owner:string){const r=tx.request(id);if(!r||r.owner_id!==owner||r.recipient_id!==config.recipientId||r.purpose!=='allocated-assessment'||r.status==='withdrawn')throw Error('The allocated assessment could not be verified.');return r;}
 async function quotationRead(who:string,id?:string){return config.repository.transaction(tx=>{staff(tx,who);const state=tx.load();if(!state)throw Error('Service ledger unavailable.');return {quotes:structuredClone(id?[quotationTarget(state,id)]:state.quotes??[])};},'ledger-only');}
 async function quotationAct(who:string,input:Record<string,unknown>,context:{recipientEmail?:string;storageProof?:{id:string;sha256:string}}={}){return config.repository.transaction(tx=>{
  staff(tx,who);if(typeof input.key!=='string'||!input.key||input.key.length>100)throw Error('Keep a valid retry key.');
  if(input.action==='quote-import-verify'&&(!context.storageProof||context.storageProof.id!==input.evidenceId||context.storageProof.sha256!==input.sha256))throw Error('Server storage verification is required.');
  const {expectedRevision,...content}=input,payload=canonical({...content,...(input.action==='quote-version-record'?{verifiedRecipientEmail:context.recipientEmail??null}:{})}),prior=tx.receipt(who,input.key);
  if(prior){if(prior.payload!==payload)throw Error('Retry key belongs to different content.');return {...prior.result,unchanged:true};}
  const state=tx.load();if(!state)throw Error('Service ledger unavailable.');const result=applyQuotation(state,input,who,now().toISOString(),context.recipientEmail);tx.save(state);tx.putReceipt(who,input.key,payload,result);return result;
 },'ledger-only');}
 return {quotationRead,quotationAct,
  async assessmentSources(who:string,enrolmentId:string){return config.repository.transaction(tx=>{actor(tx,who);const e=tx.load()?.entries.find((v:any)=>v.id===enrolmentId&&v.ownerId===who);if(!e||!e.reviews.some((r:any)=>r.status==='requested'))throw Error('An unused allocated assessment is required.');active(e);assertProgrammeAction(e,'review',now().getTime());return tx.sources(who);});},
  async read(who:string,admin=false){return config.repository.transaction(tx=>{actor(tx,who);if(admin)staff(tx,who);const state=tx.load();if(!state)throw Error('Service records have not been provisioned.');const store=createServiceRecordStore(config.recipientId,[],now,state),data=store.read(who,admin);for(const e of data.entries)for(const review of e.reviews as any[]){if(!review.requestId)continue;const r=request(tx,review.requestId,e.ownerId),replies=tx.replies(r.id);if(replies.some(p=>p.visibility!=='participants'||![r.owner_id,r.recipient_id].includes(p.author_id)))throw Error('Unexpected assessment audience.');review.submission={...r,replies};}return data;},'records-only');},
  async act(who:string,input:any,context:{recipientEmail?:string}={}){if(typeof input.action==='string'&&input.action.startsWith('quote-'))return quotationAct(who,input,context);return config.repository.transaction(tx=>{
   actor(tx,who);if(typeof input.key!=='string'||!input.key||input.key.length>100)throw Error('Keep a valid retry key.');
   input=Object.fromEntries(Object.keys(input).sort().map(k=>[k,['revision','requestRevision','quantity'].includes(k)?Number(input[k]):k==='reviewed'?(input[k]===true||input[k]==='true'):input[k]]));
   const payload=JSON.stringify(input),prior=tx.receipt(who,input.key);if(prior){if(prior.payload!==payload)throw Error('Retry key belongs to different content.');return {...prior.result,unchanged:true};}
   const state=tx.load();if(!state)throw Error('Service records have not been provisioned.');
   const assessment=['review-submit','review-reply','review-state'].includes(input.action);
   let result:any;
   if(assessment){
    const e=state.entries.find((v:any)=>v.id===input.enrolmentId),r=e?.reviews.find((v:any)=>v.id===input.itemId);
    if(!e||!r||!['collaborate','develop'].includes(e.promise.programme))throw Error('Choose an allocated assessment.');
    if(Number(input.revision)!==e.revision)throw Error('The service record changed. Reload before saving.');active(e);const released=assertProgrammeAction(e,'review',now().getTime());if(e.reviews.filter((review:any)=>review.status==='delivered').length>=released)throw Error('Current released review allocation is already delivered.');
    if(input.action==='review-submit'){
     if(e.ownerId!==who||r.status!=='requested'||r.requestId)throw Error('Only the owner can submit an unused assessment.');
     if(input.reviewed!==true&&input.reviewed!=='true')throw Error('Review the exact submission before sending.');
     if(typeof input.question!=='string'||input.question.trim().length<10||input.question.length>6000||typeof input.constraints!=='string'||input.constraints.length>4000)throw Error('Check the assessment question and context.');
     const recipient=tx.profile(config.recipientId);if(recipient?.status!=='active'||recipient.role!=='admin')throw Error('The assessment recipient is unavailable.');const source=tx.source(who,input.projectId,input.sourceFingerprint);if(!source)throw Error('The saved source changed or is not yours. Select it again.');const packet=selectedPacket(source,input.selectedText);
     const id=crypto.randomUUID();tx.putRequest({id,owner_id:who,recipient_id:config.recipientId,project_id:input.projectId,...packet,snapshot_version:1,question:input.question,constraints:input.constraints,submission_key:input.key,prior_request_id:null,status:'requested',revision:0,created_at:now().toISOString(),purpose:'allocated-assessment'});
     r.requestId=id;r.status='submitted';e.revision++;result={saved:true,unchanged:false,requestId:id};
    }else{
     staff(tx,who);if(!r.requestId)throw Error('A verified submission is required before review or delivery.');const q=request(tx,r.requestId,e.ownerId);
     if(input.action==='review-state'){
      if(input.status!=='in_review'||r.status!=='submitted')throw Error('Delivery requires the written assessment response.');r.status='in_review';q.status='in_review';q.revision++;
     }else{
      if(r.status==='delivered'||Number(input.requestRevision)!==q.revision)throw Error('The assessment changed. Reopen it before replying.');
      if(typeof input.body!=='string'||!input.body.trim()||input.body.length>20000)throw Error('Enter the written assessment response.');
      tx.putReply({id:crypto.randomUUID(),request_id:q.id,author_id:who,submission_key:input.key,body:input.body,visibility:'participants',created_at:now().toISOString()});q.status='replied';q.revision++;r.status='delivered';
     }
     tx.putRequest(q);e.revision++;result={saved:true,unchanged:false,requestId:q.id};
    }
    tx.save(state);
   }else{const store=createServiceRecordStore(config.recipientId,[],now,state);if(['schedule','attend','consultation-schedule','consultation-complete','issue-pass','release-plan'].includes(input.action))staff(tx,who);result=store.act(who,input);tx.save(store.snapshot());}
   tx.putReceipt(who,input.key,payload,result);return result;
  });}
 };
}
