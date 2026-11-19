import type {SupabaseClient} from '@supabase/supabase-js';
import {prepareEditorialService} from './editorialService';
import {isCommunityChapter,assertCommunityQuestionMinimum} from './communityChapters';
import {discoveryResult,decodeDiscoveryCursor,type DiscoveryQuery,validCommunityId} from './communityDiscovery';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const communities=['general_community','private_community'];
export type SupportProviderConfig={enabled?:boolean;recipientId?:string;historyPolicy?:'unconfigured'|'deny'|'allow';eligible:(actor:string,capability:string)=>Promise<boolean>};
/** Explicit session client and trusted eligibility input. Database policies/RPCs independently enforce access. */
export function prepareHostedSupportProvider(client:SupabaseClient,config:SupportProviderConfig){
 const service=prepareEditorialService(client,{enabled:config.enabled,ownerHistoryAfterExpiry:config.historyPolicy});
 async function actor(expected:string){
  if(config.enabled!==true)throw Error('Support connection is inactive.');
  const {data,error}=await client.auth.getUser();
  if(error||!data.user||data.user.id!==expected||!uuid.test(expected))
    throw Error('Authenticated identity could not be verified.');
  const context=await client.rpc('studio_dcs_community_member_context_v1');
  if(context.error||context.data?.id!==expected||context.data?.status!=='active')
    throw Error('Current account access is unavailable.');
  return context.data;
}
 async function allowed(who:string,cap:string){await actor(who);if(cap==='private_community')return false;if(![...communities,'editorial'].includes(cap))return false;return config.eligible(who,cap);}
 async function isStaff(who:string,_admin?:boolean){const p=await actor(who);return !!config.recipientId&&uuid.test(config.recipientId)&&who===config.recipientId&&p.role==='admin';}
 async function rpc(name:string,args:any){const {data,error}=await client.rpc(name,args);if(error||data==null)throw Error('The operation was not confirmed. Keep your draft and retry key.');return data;}
 function receipt(data:any){if(!data||!uuid.test(data.id)||typeof data.unchanged!=='boolean')throw Error('Saved receipt could not be verified. Keep the same retry key.');return data;}
 async function read(who:string){await actor(who);const data=await rpc('studio_dcs_community_read_v1',{});if(!Array.isArray(data.posts)||data.posts.length>2000)throw Error('Community response could not be verified.');for(const p of data.posts){if(!communities.includes(p.capability)||!isCommunityChapter(p.chapter)||!await allowed(who,p.capability))throw Error('Unexpected community audience.');}return {channels:await Promise.all(communities.map(async capability=>({capability,eligible:await allowed(who,capability)}))),posts:data.posts.map((p:any)=>({id:p.id,chapter:p.chapter,capability:p.capability,topic:p.topic??null,question:p.question,selected_text:p.selected_text,status:p.status,created_at:p.created_at,replies:p.replies,priority_count:p.priority_count,my_priority:p.my_priority,my_conversation:p.my_conversation,last_activity_at:p.last_activity_at,author_username:p.author_username,reply_count:p.reply_count})),editorial:[]};}
 return {allowed,isStaff,read,
 async communityRetentionStates(who:string,posts:string[]){if(!await isStaff(who,true)||!Array.isArray(posts)||posts.length>25||posts.some(id=>!uuid.test(id)))throw Error('Assigned recipient required.');return rpc('studio_dcs_retention_kept_v1',{p_posts:posts});},
 async communityRetentionKeep(who:string,p:any){if(!await isStaff(who,true)||!uuid.test(p.post)||typeof p.keep!=='boolean'||(p.expected!==null&&!uuid.test(p.expected)))throw Error('Check discussion protection.');return rpc('studio_dcs_retention_keep_v1',{p_post:p.post,p_keep:p.keep,p_expected:p.expected});},
 async communityInboxRead(who:string,p:any){if(!await isStaff(who,true))throw Error('Assigned recipient required.');const data=await rpc('studio_dcs_inbox_read_v1',{p});if(data?.version!==1||!Array.isArray(data.rows)||data.rows.length>25||!Number.isSafeInteger(data.total)||!data.counters)throw Error('Inbox unavailable.');return data;},
 async communityInboxCommand(who:string,p:any){if(!await isStaff(who,true))throw Error('Assigned recipient required.');const data=await rpc('studio_dcs_inbox_command_v1',{p});if(data?.saved!==true||data.id!==p.key)throw Error('Task result unavailable.');return data;},
 async communityBadges(who:string,post:string){await actor(who);if(!uuid.test(post))throw Error('Discussion unavailable.');return rpc('studio_dcs_community_badges_v1',{p_post:post});},
 async communityInboxContext(who:string,task:string,post:string){if(!await isStaff(who,true)||!uuid.test(task)||!uuid.test(post))throw Error('Assigned recipient required.');return rpc('studio_dcs_inbox_thread_context_v1',{p_task:task,p_post:post});},
 async communitySearch(who:string,query:DiscoveryQuery){
  if(!query||typeof query.q!=='string'||query.q.length>200||typeof query.author!=='string'||query.author.length>40||!['all','mine','leilia'].includes(query.scope)||![5,20].includes(query.limit)||(query.section&&!isCommunityChapter(query.section)))throw Error('Invalid Community search filters.');
  await actor(who);if(!await allowed(who,'general_community'))throw Error('Community is not available to your account.');
  const after=decodeDiscoveryCursor(query.cursor);if(after&&['q','section','author','scope'].some(k=>after[k]!==query[k as keyof DiscoveryQuery]))throw Error('Search continuation belongs to different filters.');
  return discoveryResult(await rpc('studio_dcs_community_search_v1',{p_query:query.q,p_section:query.section||null,p_author:query.author||null,p_scope:query.scope,p_after:after?{id:after.id,created:after.created}:null,p_snapshot:after?.snapshot??null,p_limit:query.limit}),query);
 },
 async communityThread(who:string,id:string,chapter:string,after:string='',focus:string=''){
  await actor(who);if(!validCommunityId(id)||!isCommunityChapter(chapter)||!await allowed(who,'general_community'))throw Error('Discussion unavailable.');
  const cursor=decodeDiscoveryCursor(after);if(cursor&&(cursor.post!==id||cursor.chapter!==chapter))throw Error('Reply continuation belongs to a different discussion.');
  const value=await rpc('studio_dcs_community_thread_v1',{p_post:id,p_chapter:chapter,p_after:cursor?{id:cursor.id,created:cursor.created}:null,p_focus:validCommunityId(focus)?focus:null,p_limit:40});
  if(value?.version===1&&value.post===null&&value.next===null)return{post:null,next:null};
  const p=value?.post;if(value?.version!==1||!p||p.id!==id||p.chapter!==chapter||p.capability!=='general_community'||!['published','locked'].includes(p.status)||typeof p.question!=='string'||p.question.length>12000||!Array.isArray(p.replies)||p.replies.length>80||new TextEncoder().encode(JSON.stringify(value)).length>3500000)throw Error('Discussion response unavailable.');
  const ids=new Set<string>();for(const r of p.replies){if(!validCommunityId(r.id)||ids.has(r.id)||typeof r.body!=='string'||r.body.length>8000||typeof r.deleted!=='boolean'||typeof r.my_reply!=='boolean'||(r.deleted&&(r.body!==(r.hidden===true?'Comment hidden':'Comment deleted')||r.author_username!==null||r.my_reply)))throw Error('Unexpected reply response.');ids.add(r.id);}
  for(const r of p.replies)if(r.parent_reply_id&&(!ids.has(r.parent_reply_id)||p.replies.find((v:any)=>v.id===r.parent_reply_id)?.parent_reply_id))throw Error('Invalid discussion nesting.');
  const replies=p.replies.map((r:any)=>({id:r.id,body:r.body,created_at:r.created_at,updated_at:r.updated_at,parent_reply_id:r.parent_reply_id,deleted:r.deleted,hidden:r.hidden===true,my_reply:r.my_reply,author_username:r.author_username,has_children:r.has_children===true}));
  if(value.next&&(!validCommunityId(value.next.id)||!Number.isFinite(Date.parse(value.next.created))||!Number.isFinite(Date.parse(value.next.snapshot))))throw Error('Invalid reply continuation.');
  return {post:{id:p.id,question:p.question,chapter:p.chapter,capability:p.capability,status:p.status,created_at:p.created_at,author_username:p.author_username,replies},next:value.next?{id:value.next.id,created:value.next.created,snapshot:value.next.snapshot}:null};
 },
 async submit(who:string,input:any){await actor(who);if(!communities.includes(input.capability)||!isCommunityChapter(input.chapter)||!input.reviewed||!await allowed(who,input.capability))throw Error('Review an available community and chapter first.');if(!(uuid.test(input.project_id)||(communities.includes(input.capability)&&input.project_id===null&&input.selected_text===''))||!uuid.test(input.submission_key)||typeof input.question!=='string'||input.question.length>6000||typeof input.selected_text!=='string'||input.selected_text.length>4000)throw Error('Check the question and selected passage.');assertCommunityQuestionMinimum(input.question);return receipt(await rpc('studio_dcs_community_submit_v1',{p_project:input.project_id,p_key:input.submission_key,p_chapter:input.chapter,p_capability:input.capability,p_question:input.question,p_selected:input.selected_text}));},
 async priority(who:string,postId:string,selected:boolean){await actor(who);if(!uuid.test(postId)||!await allowed(who,'general_community'))throw Error('General community access required.');return rpc('studio_dcs_community_priority_v1',{p_post:postId,p_selected:selected});},
 async memberReply(who:string,input:{postId:string;parentId:string|null;body:string;key:string}){
  await actor(who);
  if(!uuid.test(input.postId)||!uuid.test(input.key)||(input.parentId!==null&&!uuid.test(input.parentId))||typeof input.body!=='string'||input.body.trim().length<2||input.body.length>8000)throw Error('Check the comment, discussion and retry key.');
  return rpc('studio_dcs_community_member_reply_v2',{p_post:input.postId,p_parent:input.parentId,p_body:input.body,p_key:input.key});
 },
 async memberEditReply(who:string,input:{replyId:string;body:string;expectedUpdatedAt:string}){
  await actor(who);
  if(!uuid.test(input.replyId)||typeof input.body!=='string'||input.body.trim().length<2||input.body.length>8000||typeof input.expectedUpdatedAt!=='string'||!Number.isFinite(Date.parse(input.expectedUpdatedAt)))throw Error('Check the edited comment and revision.');
  return rpc('studio_dcs_community_member_edit_reply_v2',{p_reply:input.replyId,p_body:input.body,p_expected_updated_at:input.expectedUpdatedAt});
 },
 async memberDeleteReply(who:string,input:{replyId:string;expectedUpdatedAt:string}){
  await actor(who);
  if(!uuid.test(input.replyId)||typeof input.expectedUpdatedAt!=='string'||!Number.isFinite(Date.parse(input.expectedUpdatedAt)))throw Error('Check the comment and revision.');
  return rpc('studio_dcs_community_member_delete_reply_v2',{p_reply:input.replyId,p_expected_updated_at:input.expectedUpdatedAt});
 },
 async memberActivityRead(who:string){
  await actor(who);
  const data=await rpc('studio_dcs_community_activity_read_v1',{});
  if(!Array.isArray(data)||data.length>2000)throw Error('Community activity response could not be verified.');
  return data;
 },
 async memberActivityAck(who:string,activityId:string){
  await actor(who);
  if(!uuid.test(activityId))throw Error('Invalid Community activity identifier.');
  const result=await rpc('studio_dcs_community_activity_ack_v1',{p_activity:activityId});
  if(typeof result!=='boolean')throw Error('Community acknowledgement could not be verified.');
  return result;
 },
 async communityScribes(who:string,post:string,replies:string[]=[]){await actor(who);if(!uuid.test(post)||!Array.isArray(replies)||replies.length>80||replies.some(r=>!uuid.test(r))||new Set(replies).size!==replies.length)throw Error('Invalid appreciation targets.');const data=await rpc('studio_dcs_community_scribes_read_v1',{p_post:post,p_replies:replies});if(!Array.isArray(data)||data.length!==replies.length+1)throw Error('Appreciation unavailable.');const targets=new Set([null,...replies]);for(const x of data){if(!targets.delete(x.reply_id)||!Number.isSafeInteger(x.count)||x.count<0||typeof x.selected!=='boolean'||typeof x.eligible!=='boolean'||typeof x.withdrawable!=='boolean')throw Error('Appreciation unavailable.');}return data.map(x=>({reply_id:x.reply_id,count:x.count,selected:x.selected,eligible:x.eligible,withdrawable:x.withdrawable}));},
 async communityScribe(who:string,post:string,reply:string|null,selected:boolean){await actor(who);if(!uuid.test(post)||(reply!==null&&!uuid.test(reply))||typeof selected!=='boolean')throw Error('Invalid appreciation.');const x=await rpc('studio_dcs_community_scribe_v1',{p_post:post,p_reply:reply,p_selected:selected});if(x.reply_id!==reply||typeof x.selected!=='boolean'||!Number.isSafeInteger(x.count)||x.count<0||typeof x.eligible!=='boolean'||typeof x.withdrawable!=='boolean')throw Error('Appreciation unavailable.');return{reply_id:reply,count:x.count,selected:x.selected,eligible:x.eligible,withdrawable:x.withdrawable};},
 async communityReport(who:string,x:any){await actor(who);if(!uuid.test(x.post)||(x.reply!==null&&!uuid.test(x.reply))||!uuid.test(x.key)||!['spam','disrespectful_or_harmful','privacy_concern','off_topic','duplicate','other'].includes(x.reason)||typeof x.notes!=='string'||x.notes.length>2000)throw Error('Check report.');return receipt(await rpc('studio_dcs_community_report_v1',{p_post:x.post,p_reply:x.reply,p_key:x.key,p_reason:x.reason,p_notes:x.notes}));},
 async communityModerate(who:string,x:any,admin:boolean){if(!await isStaff(who,admin))throw Error('Assigned recipient required.');if(!uuid.test(x.post)||(x.reply!==null&&!uuid.test(x.reply))||!uuid.test(x.key)||(x.report!==null&&!uuid.test(x.report))||!['hide','restore','lock','unlock','dismiss'].includes(x.action)||typeof x.reason!=='string'||x.reason.trim().length<5||x.reason.length>1000||!Number.isFinite(Date.parse(x.expected)))throw Error('Check moderation details.');return receipt(await rpc('studio_dcs_community_moderate_v1',{p_post:x.post,p_reply:x.reply,p_action:x.action,p_expected:x.expected,p_reason:x.reason,p_key:x.key,p_report:x.report}));},
 async communityModerationRead(who:string,admin:boolean){if(!await isStaff(who,admin))throw Error('Assigned recipient required.');const x=await rpc('studio_dcs_community_moderation_read_v1',{});if(!Array.isArray(x.reports)||x.reports.length>100||!Array.isArray(x.audit)||x.audit.length>200||new TextEncoder().encode(JSON.stringify(x)).length>2000000)throw Error('Moderation queue unavailable.');return x;},
 async communityAdminRead(who:string,admin:boolean){if(!await isStaff(who,admin))throw Error('Assigned community recipient required.');const data=await rpc('studio_dcs_community_admin_read_v1',{});if(!Array.isArray(data)||data.some((p:any)=>p.contract_version!==2||!communities.includes(p.capability)||!isCommunityChapter(p.chapter)||!Array.isArray(p.replies)))throw Error('Unexpected community queue.');return data;},
 async communityAdminReply(who:string,input:any,admin:boolean){if(!await isStaff(who,admin))throw Error('Assigned community recipient required.');if(!uuid.test(input.postId)||!uuid.test(input.key)||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||typeof input.body!=='string'||!input.body.trim())throw Error('Check the reply and revision.');if(input.body.length>8000)throw Error('Keep your reply to 8,000 characters or fewer. Nothing has been saved or shortened.');return receipt(await rpc('studio_dcs_community_reply_v1',{p_post:input.postId,p_key:input.key,p_expected_revision:input.expectedRevision,p_body:input.body}));},
 async editorialRead(who:string,project:string,admin:boolean){await actor(who);const staff=await isStaff(who,admin),data=staff?await service.readAssigned():await service.readOwner(project);return {staff,requests:data.requests.map((r:any)=>({...r,replies:data.replies.filter((p:any)=>p.request_id===r.id)}))};},
 async editorialSubmitInput(who:string,input:any){await actor(who);if(!config.recipientId||!uuid.test(config.recipientId))throw Error('The confidential recipient has not been verified.');if(!await allowed(who,'editorial'))throw Error('Confidential editorial access is unavailable.');return service.submit(input);},
 async editorialAction(who:string,input:any,admin:boolean){await actor(who);if(input.action==='review'){if(!await isStaff(who,admin))throw Error('Assigned recipient required.');return service.review({requestId:input.id,expectedRevision:input.expected_revision});}if(input.action!=='reply')throw Error('Choose a supported conversation action.');const v={requestId:input.id,submissionKey:input.key,expectedRevision:input.expected_revision,body:input.body};return await isStaff(who,admin)?service.reply(v):service.followUp(v);}
 };
}




