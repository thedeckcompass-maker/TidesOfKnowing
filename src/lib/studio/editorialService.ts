/** Review-only composition. No route imports this factory; activation defaults OFF. */
import type {SupabaseClient} from '@supabase/supabase-js';
import {prepareAuthenticatedEditorialStore,type EditorialTextInput,type EditorialSourceLinks} from './editorialPersistence';
export type EditorialServiceOptions={enabled?:boolean;ownerHistoryAfterExpiry?:'unconfigured'|'deny'|'allow'};
type ReplyInput={requestId:string;submissionKey:string;expectedRevision:number;body:string};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function id(value:unknown){if(typeof value!=='string'||!uuid.test(value))throw Error('Invalid editorial identity.');return value;}
export function prepareEditorialService(client:SupabaseClient,options:EditorialServiceOptions={}){
 const store=prepareAuthenticatedEditorialStore(client);
 function enabled(){if(options.enabled!==true)throw Error('Hosted editorial service is not activated. Nothing has been sent.');}
 async function actor(){enabled();const {data,error}=await client.auth.getUser();if(error||!data.user)throw Error('Sign in with your existing account.');return id(data.user.id);}
 async function historyGate(projectId:string){await actor();if(!options.ownerHistoryAfterExpiry||options.ownerHistoryAfterExpiry==='unconfigured')throw Error('Owner history policy is not configured.');const {data,error}=await client.rpc('studio_editorial_history_access_v1',{p_project:id(projectId),p_allow_expired:options.ownerHistoryAfterExpiry==='allow'});if(error||data!==true)throw Error('Private history access is unavailable.');}
 async function sendReply(input:ReplyInput,rpc:'studio_reply_editorial_v1'|'studio_followup_editorial_v1'){
   const user=await actor();id(input.requestId);id(input.submissionKey);if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||typeof input.body!=='string'||!input.body.trim()||input.body.length>20000)throw Error('Check the reply and current revision. Your draft has not been shortened.');
   const {data,error}=await client.rpc(rpc,{p_request:input.requestId,p_key:input.submissionKey,p_expected_revision:input.expectedRevision,p_body:input.body});
   if(error||!data||typeof data.unchanged!=='boolean')throw Error('Reply outcome is unconfirmed. Keep the draft and same submission key.');id(data.id);
   const read=await client.from('studio_editorial_replies').select('id,request_id,author_id,submission_key,body,visibility').eq('id',data.id).maybeSingle();
   if(read.error||!read.data||read.data.author_id!==user||read.data.request_id!==input.requestId||read.data.submission_key!==input.submissionKey||read.data.body!==input.body||read.data.visibility!=='participants')throw Error('Reply readback is unconfirmed. Keep the draft and same submission key.');return {record:read.data,unchanged:data.unchanged};
 }
 return {
  async review(input:{requestId:string;expectedRevision:number}){const user=await actor();id(input.requestId);if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw Error('Check the current revision.');const {data,error}=await client.rpc('studio_review_editorial_v1',{p_request:input.requestId,p_expected_revision:input.expectedRevision});if(error||!data||data.id!==input.requestId||typeof data.unchanged!=='boolean'||!Number.isSafeInteger(data.revision))throw Error('Review state is unconfirmed. Reopen the conversation before retrying.');const read=await client.from('studio_editorial_requests').select('id,recipient_id,status,revision').eq('id',input.requestId).maybeSingle();if(read.error||read.data?.recipient_id!==user||read.data.status!=='in_review'||read.data.revision!==data.revision)throw Error('Review readback is unconfirmed.');return data;},
  async submit(input:EditorialTextInput){enabled();return store.submit(input);},
  async readOwner(projectId:string){await historyGate(projectId);return store.readOwner(projectId);},
  async exportOwner(projectId:string,links:EditorialSourceLinks,prior?:unknown){await historyGate(projectId);return store.exportOwner(projectId,links,prior);},
  async readAssigned(){const user=await actor();const {data,error}=await client.rpc('studio_editorial_assigned_history_v1');if(error||!data||data.version!==1||data.consistent_snapshot!==true||!Array.isArray(data.requests)||!Array.isArray(data.replies)||data.requests.length>1000||data.replies.length>10000||new TextEncoder().encode(JSON.stringify(data)).length>2*1024*1024)throw Error('Assigned editorial history could not be verified.');const ids=new Set<string>();for(const r of data.requests){id(r.id);id(r.owner_id);if(r.recipient_id!==user||ids.has(r.id))throw Error('Unexpected editorial recipient.');ids.add(r.id);}for(const r of data.replies){const parent=data.requests.find((p:any)=>p.id===r.request_id);if(!parent||r.visibility!=='participants'||![parent.owner_id,user].includes(r.author_id))throw Error('Unexpected reply audience.');}return data;},
  // Authenticated author and configured recipient are resolved by the reviewed server RPCs.
  reply(input:ReplyInput){return sendReply(input,'studio_reply_editorial_v1');},
  followUp(input:ReplyInput){return sendReply(input,'studio_followup_editorial_v1');}
 };
}
