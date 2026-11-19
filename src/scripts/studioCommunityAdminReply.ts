/** Saved receipts and authorised readback are separate; never replay a write on a read failure. */
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
for(const form of document.querySelectorAll<HTMLFormElement>('[data-reply]')){
 const button=form.querySelector<HTMLButtonElement>('button[type=submit]')!,status=form.querySelector<HTMLElement>('[data-status]')!,body=form.querySelector<HTMLTextAreaElement>('[name=body]')!;
 const key=form.querySelector<HTMLInputElement>('[name=submission_key]')!,revision=form.querySelector<HTMLInputElement>('[name=expected_revision]')!,post=form.querySelector<HTMLInputElement>('[name=post_id]')!;
 let busy=false,blocked=false,savedId='',submitted='';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Check saved reply';refresh.hidden=true;form.append(refresh);
 async function readback(){
  refresh.disabled=true;
  try{
   const response=await fetch(form.action,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('READ_FAILED');
   const data=await response.json(),thread=Array.isArray(data.posts)?data.posts.find((p:any)=>p.id===post.value):null;
   if(!thread||!Array.isArray(thread.replies)||thread.replies.some((r:any)=>!r||!uuid.test(r.id)||typeof r.body!=='string')||new Set(thread.replies.map((r:any)=>r.id)).size!==thread.replies.length)throw Error('READ_INVALID');
   const reply=thread.replies.find((r:any)=>r.id===savedId);
   if(!reply||reply.body!==submitted)throw Error('READ_UNCONFIRMED');
   const replies=form.closest('[data-post]')!.querySelector<HTMLElement>('[data-replies]')!;
   // Keep existing item-level moderation forms and unsent reasons intact.
   for(const r of thread.replies){if([...replies.querySelectorAll<HTMLElement>('[data-reply-id]')].some(el=>el.dataset.replyId===r.id))continue;const item=document.createElement('article');item.className='admin-comment';item.dataset.replyId=r.id;item.dataset.adminItem='';item.dataset.kind=r.parent_reply_id?'reply':'comment';item.dataset.itemStatus=r.status;item.dataset.mentions=String(r.mentions_leilia===true);item.dataset.openReports=String(r.open_report_count??0);item.dataset.scribes=String(r.scribe_count??0);const meta=document.createElement('p');meta.className='admin-item-meta';meta.textContent='Comment · '+(r.author_username??'Community member');const context=document.createElement('small');context.dataset.contextLabel='';context.hidden=true;context.textContent='Parent context';meta.append(context);const text=document.createElement('p');text.className='admin-words';text.textContent=r.body;const link=document.createElement('a');link.href=location.pathname+'?chapter='+encodeURIComponent(form.closest<HTMLElement>('[data-chapter]')?.dataset.chapter??'spark')+'#moderate-'+r.id;link.textContent='Show comment actions';item.append(meta,text,link);const group=document.createElement('div');group.className='admin-thread-group';group.dataset.threadGroup='';group.append(item);replies.append(group);}
   form.dispatchEvent(new CustomEvent('dcs-admin-comments-updated',{bubbles:true}));
   revision.value=String(thread.replies.length);key.value=crypto.randomUUID();body.value='';body.readOnly=false;blocked=false;savedId='';button.disabled=false;refresh.hidden=true;status.textContent='Your reply is saved. Existing moderation controls and drafts are preserved.';
  }catch{
   status.textContent='Your reply was saved. The refreshed discussion is not available yet. Do not send it again. Your text is kept here; use Check saved reply to check without resending.';refresh.hidden=false;
  }finally{refresh.disabled=false;}
 }
 refresh.addEventListener('click',async()=>{if(busy||!savedId)return;busy=true;try{await readback();}finally{busy=false;}});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||blocked)return;
  if(!body.value.trim()){status.textContent='Enter a reply before saving.';body.focus();return;}
  if(body.value.length>8000){status.textContent='Keep your reply to 8,000 characters or fewer. Your full draft is still here; nothing has been sent or shortened.';body.focus();return;}
  busy=true;button.disabled=true;body.readOnly=true;submitted=body.value;
  try{
   const response=await fetch(form.action,{method:'POST',body:new FormData(form),credentials:'same-origin'});
   if(!response.ok){
    if(response.status===409){status.textContent='Your reply was not confirmed. The discussion may have changed or access may no longer be available. Your draft is kept here. Reopen the discussion before saving again.';}
    else{status.textContent='Your reply was not confirmed. Keep this draft and check the discussion before saving again.';}
    blocked=true;body.readOnly=false;return;
   }
   // Hosted RPC supplies {id,unchanged}; local integration may supply {reply,revision}.
   const data=await response.json(),id=data?.id??data?.reply?.id;
   if(!uuid.test(id)||!(typeof data.unchanged==='boolean'||(data.reply&&Number.isSafeInteger(data.revision))))throw Error('UNVERIFIED_RECEIPT');
   savedId=id;blocked=true;status.textContent='Your reply is saved. Checking the refreshed discussion…';await readback();
  }catch{
   blocked=true;body.readOnly=false;status.textContent='The save result could not be confirmed. Your draft and submission reference are kept here. Check the discussion before doing anything further; do not send this reply again.';
  }finally{busy=false;button.disabled=blocked;}
 });
}
window.addEventListener('beforeunload',e=>{if([...document.querySelectorAll<HTMLTextAreaElement>('[data-reply] textarea')].some(t=>t.value.trim())){e.preventDefault();e.returnValue='';}});
