import {canContribute} from './auth';
import {json} from './api';
import {parkedCommonsResponse} from './practiceCommons';
import {studioAccessResponse,sameOriginMutation} from '../studio/access';
import {supportStore} from '../studio/supportProvider';
import {createCommunityServiceClient} from './supabaseServer';
import {cleanText,validateReplyInput,validateReportInput} from './validation';
import {createCommunityReport} from './mutations';

import {communityPostPath} from './slugs';

/** DCS-specific adapter. Generic public mutation helpers remain private-denying. */
export async function dcsParticipationAccess(locals:any):Promise<Response|null>{
 if(!locals.user||locals.profile?.id!==locals.user.id||!canContribute(locals.profile))return json({ok:false,error:'Please log in with an active account.'},401);
 const denied=await studioAccessResponse(locals.user,locals.profile,locals.supabase);if(denied)return json({ok:false,error:'Discussion not found.'},404);
 try{const store=supportStore(locals);if(!store||!await store.allowed(locals.user.id,'private_community'))return json({ok:false,error:'Discussion not found.'},404);}catch{return json({ok:false,error:'Community access could not be verified.'},503)}
 return null;
}
async function target(client:any,kind:'post'|'reply',id:string){
 let reply:any=null;
 if(kind==='reply'){const r=await client.from('community_replies').select('id,post_id,author_id,status').eq('id',id).maybeSingle();if(r.error||!r.data)return null;reply=r.data;}
 const p=await client.from('community_posts').select('id,section_id,author_id,status,slug').eq('id',reply?reply.post_id:id).maybeSingle();if(p.error||!p.data)return null;
 const s=await client.from('community_sections').select('id,key,is_active').eq('id',p.data.section_id).maybeSingle();if(s.error||!s.data)return null;
 return {post:p.data,reply,section:s.data};
}
export async function dcsParticipation(ctx:any,op:'reply'|'edit-post'|'edit-reply'|'report',payload:any):Promise<Response>{
 if(!sameOriginMutation(ctx.request))return json({ok:false,error:'Same-origin request required.'},403);
 const denied=await dcsParticipationAccess(ctx.locals);if(denied)return denied;
 const kind=op==='edit-reply'||(op==='report'&&payload.contentType==='reply')?'reply':'post';
 const id=op==='report'?payload.contentId:ctx.params.id;
 if(typeof id!=='string'||!id)return json({ok:false,error:'Missing target.'},400);
 const t=await target(ctx.locals.supabase,kind,id);
 if(!t)return json({ok:false,error:'Discussion not found.'},404);
 if(['reading-practice','reader-development'].includes(t.section.key))return parkedCommonsResponse();
 if(t.section.key!=='deck-creator-studio'||t.section.is_active!==true)return json({ok:false,error:'Discussion not found.'},404);
 const actor=ctx.locals.user.id,editing=op==='edit-post'||op==='edit-reply',record=t.reply??t.post;
 if(!['published','locked'].includes(t.post.status)||(t.reply&&t.reply.status!=='published'))return json({ok:false,error:'Discussion not available.'},404);
 if(op!=='report'&&t.post.status!=='published')return json({ok:false,error:'This discussion is closed.'},403);
 if(editing&&record.author_id!==actor)return json({ok:false,error:'You can only edit your own contribution.'},403);
 if(payload.sectionKey!==undefined&&payload.sectionKey!=='deck-creator-studio')return json({ok:false,error:'The discussion audience cannot be changed.'},409);
 let value:any;
 if(op==='report'){const v=validateReportInput(payload);if(!v.ok)return json({ok:false,error:v.error},400);value=v.value;}
 else if(op==='edit-post'){const title=cleanText(payload.title).replace(/\s+/g,' '),body=cleanText(payload.body);if(title.length<8||title.length>140||body.length<20||body.length>12000)return json({ok:false,error:'Use a title of 8–140 characters and body of 20–12,000 characters.'},400);value={title,body};}
 else {const v=validateReplyInput(payload);if(!v.ok)return json({ok:false,error:v.error},400);value=v.value;}
 // All identity, membership, persisted room, ownership and input checks precede privilege.
 const service=createCommunityServiceClient(ctx.locals),fresh=await target(service,kind,id);
 if(!fresh||JSON.stringify(fresh)!==JSON.stringify(t))return json({ok:false,error:'The discussion changed. Reload before retrying.'},409);
 if(op==='report'){const r=await createCommunityReport(service,{reporterUserId:actor,...value});if(!r.ok)return json({ok:false,error:r.error},r.status??500);}
 else if(op==='reply'){
 const r=await service.from('community_replies').insert({post_id:t.post.id,author_id:actor,body:value.body}).select('id').single();if(r.error||!r.data)return json({ok:false,error:'Unable to add the reply. Keep your draft.'},503);
 
 }else{
 const table=op==='edit-post'?'community_posts':'community_replies';const r=await service.from(table).update(value).eq('id',id).eq('author_id',actor).eq('status','published').select('id').maybeSingle();if(r.error||!r.data)return json({ok:false,error:'The contribution changed. Keep your draft and reload.'},409);
 }
 if(ctx.request.headers.get('accept')?.includes('application/json'))return json({ok:true});
 return ctx.redirect(communityPostPath(t.post.slug)+(op==='report'?'?report=sent#replies':'#replies'),303);
}



