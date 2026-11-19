import type {APIRoute} from 'astro';
import {supportStore} from '../../../lib/studio/supportProvider';
import {editorialSources,selectedPacket} from '../../../lib/studio/editorialSnapshots';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';
import {isAdminProfile} from '../../../lib/community/auth';
export const prerender=false;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
function actor(locals:App.Locals){return locals.user&&locals.profile?.id===locals.user.id&&locals.profile.status==='active'?locals.user.id:null;}
export const GET:APIRoute=async({locals,url})=>{const id=actor(locals);if(!id)return json({error:'Sign in with your existing account.'},401);const store=supportStore(locals);if(!store)return json({error:'Hosted editorial requests are not connected.'},503);try{return json(await store.editorialRead(id,url.searchParams.get('project')??'',isAdminProfile(locals.profile)));}catch{return json({error:'This private conversation is not available.'},403);}};
export const POST:APIRoute=async({request,locals})=>{if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);const id=actor(locals);if(!id)return json({error:'Sign in with your existing account.'},401);const store=supportStore(locals);if(!store)return json({error:'Hosted editorial requests are not connected. Nothing has been sent.'},503);try{const f=await limitedForm(request,100000),action=String(f.get('action'));if(action==='reply'||action==='review')return json(await store.editorialAction(id,{action,id:String(f.get('id')),key:String(f.get('reply_key')),expected_revision:Number(f.get('expected_revision')),body:String(f.get('body')??'')},isAdminProfile(locals.profile)));
if(action!=='submit'||!await store.allowed(id,'editorial'))return json({error:'Confidential editorial access is not available.'},403);
const projectId=String(f.get('project_id')),key=String(f.get('submission_key')),input={question:String(f.get('question')??''),constraints:String(f.get('constraints')??''),selected_text:String(f.get('selected_text')??''),source_fingerprint:String(f.get('source_fingerprint')??''),prior_request_id:String(f.get('prior_request_id')??'')};
// Reconcile a committed retry before loading a source that may since have changed.
if(store.editorialSubmitInput)return json(await store.editorialSubmitInput(id,{projectId,submissionKey:key,sourceFingerprint:input.source_fingerprint,selectedText:input.selected_text,question:input.question,constraints:input.constraints,priorRequestId:input.prior_request_id,reviewed:f.get('reviewed')==='on'}));
const existing=store.editorialRetry(id,key,projectId,input);if(existing)return json(existing);
const {sources}=await editorialSources(locals.supabase!,id,projectId),source=sources.find(s=>s.fingerprint===input.source_fingerprint);if(!source)throw Error('That saved source changed or is no longer available. Keep your draft and explicitly select/review a source again.');
return json(store.editorialSubmit(id,{...input,...selectedPacket(source,input.selected_text),project_id:projectId,submission_key:key,reviewed:f.get('reviewed')==='on'}));}catch(e){return json({error:(e as Error).message+' Your draft has not been replaced.'},409);}};
