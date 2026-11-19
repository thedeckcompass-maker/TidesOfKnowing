/** Existing authorised mutation port + fresh authorised page readback. No cached private drafts. */
const root=document.querySelector<HTMLElement>('[data-community-thread]');
if(root){
 const taskContext=root.dataset.adminTask?JSON.parse(root.dataset.adminTask):null;
 const adminReturn=root.dataset.adminReturn??'';
 if(taskContext&&!taskContext.completed&&['question','comment'].includes(taskContext.kind))root.querySelectorAll<HTMLFormElement>('[data-member-mutation]').forEach(form=>{
  const payload=new FormData(form);if(payload.get('action')!=='reply'||(payload.get('parent_id')||null)!==(taskContext.kind==='question'?null:taskContext.parent))return;
  for(const[name,value]of Object.entries({admin_task:taskContext.id,task_version:String(taskContext.version),admin_return:adminReturn})){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.append(input);}
 });
 if(taskContext?.reply){const focus=document.getElementById('reply-'+taskContext.reply);focus?.classList.add('community-admin-focus');focus?.scrollIntoView({block:'center'});}
 const busy=new WeakSet<HTMLFormElement>();
 let writing=false;
 const value=(f:HTMLFormElement,name:string)=>String(new FormData(f).get(name)??'');
 const comment=(e:Element)=>e.closest<HTMLElement>('[data-comment-id]');
 const valid=(form:HTMLFormElement)=>{const body=form.querySelector<HTMLTextAreaElement>('textarea');if(!body)return true;const text=body.value.trim();return text.length>=2&&text.length<=8000&&(!form.hasAttribute('data-edit-form')||text!==form.dataset.original?.trim());};
 function sync(form:HTMLFormElement){const submit=form.querySelector<HTMLButtonElement>('[type=submit]');if(submit)submit.disabled=busy.has(form)||writing||!valid(form);const label=form.querySelector('[data-edit-state]');if(label)label.textContent=valid(form)?'Unsaved changes':'No valid changes';}
 const forms=()=>root.querySelectorAll<HTMLFormElement>('[data-member-mutation]');
 forms().forEach(f=>{if(f.hasAttribute('data-edit-form'))f.dataset.original=f.querySelector<HTMLTextAreaElement>('textarea')?.value??'';sync(f);});
 root.addEventListener('input',e=>{const form=(e.target as Element).closest<HTMLFormElement>('form');if(form?.matches('[data-member-mutation]'))sync(form);});
 root.addEventListener('click',e=>{
  const target=(e.target as Element).closest<HTMLElement>('button');if(!target||writing)return;
  const item=comment(target);if(!item)return;
  const edit=item.querySelector<HTMLFormElement>('[data-edit-form]'),reading=item.querySelector<HTMLElement>('[data-reading]'),compose=item.querySelector<HTMLElement>('[data-reply-composer]');
  if(target.hasAttribute('data-edit-comment')&&edit&&reading){edit.hidden=false;reading.hidden=true;edit.querySelector('textarea')?.focus();}
  if(target.hasAttribute('data-cancel-edit')&&edit&&reading){edit.querySelector<HTMLTextAreaElement>('textarea')!.value=edit.dataset.original??'';edit.hidden=true;reading.hidden=false;const error=edit.querySelector<HTMLElement>('[data-mutation-error]');if(error)error.hidden=true;sync(edit);reading.querySelector<HTMLButtonElement>('[data-edit-comment]')?.focus();}
  if(target.hasAttribute('data-toggle-reply')&&compose){compose.hidden=!compose.hidden;target.setAttribute('aria-expanded',String(!compose.hidden));if(!compose.hidden)compose.querySelector('textarea')?.focus();}
  if(target.hasAttribute('data-cancel-reply')&&compose){compose.hidden=true;const toggle=item.querySelector<HTMLButtonElement>('[data-toggle-reply]');toggle?.setAttribute('aria-expanded','false');toggle?.focus();}
 });
 root.addEventListener('submit',async event=>{
  const form=event.target as HTMLFormElement;if(!form.matches('[data-member-mutation]'))return;event.preventDefault();
  if(writing||!valid(form)||!form.reportValidity())return;
  const action=value(form,'action');
  if(action==='delete'&&!confirm(form.dataset.hasChildren==='true'?'Delete your comment? Replies from other members will remain.':'Delete your comment?'))return;
  const old=comment(form),text=value(form,'body').trim(),payload=new FormData(form);
  const error=form.querySelector<HTMLElement>('[data-mutation-error]');if(error){error.hidden=true;error.textContent='';}
  const submittedBody=form.querySelector<HTMLTextAreaElement>('textarea');
  if(submittedBody)submittedBody.readOnly=true;
  writing=true;busy.add(form);root.setAttribute('aria-busy','true');forms().forEach(sync);
  try{
   const response=await fetch(form.getAttribute('action')!,{method:'POST',credentials:'same-origin',body:payload,redirect:'error'});
   const result=await response.json();
   if(!response.ok||typeof result?.id!=='string'||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(result.id))throw Error('Your change was not confirmed. Keep your draft.');
   if(action!=='reply'&&result.id!==value(form,'reply_id'))throw Error('The changed comment identity was not confirmed.');
   if(payload.has('admin_task')&&(result.task!==payload.get('admin_task')||!Number.isSafeInteger(result.taskVersion)||typeof result.returnTo!=='string'||!result.returnTo.startsWith('/ask-leilia/admin/studio-community/?')))throw Error('Task completion could not be confirmed.');
   // A deleted reply cannot be used as the server's published-reply focus.
   // Keep the current page cursor for deletion; other mutations still use focused readback.
   const url=new URL(location.href);url.hash='';const wasFocused=url.searchParams.has('reply');
   if(action==='delete')url.searchParams.delete('reply');
   else{url.searchParams.set('reply',result.id);url.searchParams.delete('replies');}
   const read=await fetch(url,{credentials:'same-origin',cache:'no-store',redirect:'error'});
   if(!read.ok)throw Error('Your change may have saved, but could not be read back. Keep your draft and reload before trying again.');
   const doc=new DOMParser().parseFromString(await read.text(),'text/html');
   if(doc.querySelector('[data-community-thread]')?.getAttribute('data-community-thread')!==root.getAttribute('data-community-thread'))throw Error('The updated discussion could not be verified. Keep your draft and reload.');
   const fresh=doc.getElementById('reply-'+result.id);
   if(action==='delete'){
    if(fresh&&fresh.dataset.deleted!=='true')throw Error('Deletion could not be verified. Reload before trying again.');
    if(!fresh&&(wasFocused||form.dataset.hasChildren==='true'))throw Error('The deleted comment may have moved outside this page. Reload before retrying.');
   }else if(!fresh||fresh.dataset.deleted==='true'||fresh.querySelector('[data-comment-text]')?.textContent?.trim()!==text||!fresh.dataset.updatedAt){throw Error('The saved comment could not be verified. Keep your draft and reload before trying again.');}
   const replace=(item:HTMLElement,f:HTMLElement)=>{const node=document.importNode(f,true);const draft=item.querySelector<HTMLTextAreaElement>('[data-reply-composer] textarea'),nextDraft=node.querySelector<HTMLTextAreaElement>('[data-reply-composer] textarea');if(draft&&nextDraft)nextDraft.value=draft.value;item.replaceWith(node);node.querySelectorAll<HTMLFormElement>('[data-edit-form]').forEach(g=>{g.dataset.original=g.querySelector<HTMLTextAreaElement>('textarea')?.value??'';});return node;};
   if(action==='reply'){
    // Merge into the existing root so other open editors/drafts are never replaced.
    const parent=value(form,'parent_id');let group:HTMLElement|null=null;
    if(parent){group=document.getElementById('reply-'+parent)?.closest<HTMLElement>('.dcs-thread__group')??null;if(!group)throw Error('The reply context is unavailable. Keep your draft and reload.');let nested=group.querySelector<HTMLDetailsElement>('.dcs-thread__nested');
     if(!nested){const from=doc.getElementById('reply-'+parent)?.closest('.dcs-thread__group')?.querySelector<HTMLDetailsElement>('.dcs-thread__nested');if(!from)throw Error('The saved reply context could not be verified. Keep your draft.');nested=document.importNode(from,false);const branch=document.createElement('div');branch.className='dcs-thread__branch';branch.setAttribute('role','group');branch.setAttribute('aria-label','Replies in this thread');const summary=document.createElement('summary');summary.textContent='Replies';nested.append(summary,branch);group.append(nested);}
     nested.open=true;const branch=nested.querySelector<HTMLElement>('.dcs-thread__branch')!;const existing=document.getElementById('reply-'+result.id);if(existing)replace(existing,fresh!);else branch.append(document.importNode(fresh!,true));
     nested.querySelector('summary')!.textContent=`${branch.children.length} ${branch.children.length===1?'reply':'replies'}`;
    }else{const source=fresh!.closest<HTMLElement>('.dcs-thread__group');if(!source)throw Error('The saved discussion context could not be verified. Keep your draft.');if(!document.getElementById('reply-'+result.id))root.querySelector('.dcs-thread__responses')!.append(document.importNode(source,true));}
    root.querySelector('.community-empty')?.remove();
    form.querySelector<HTMLTextAreaElement>('textarea')!.value='';form.querySelector<HTMLInputElement>('[name=submission_key]')!.value=crypto.randomUUID();
   }else if(old){if(fresh)replace(old,fresh);else {const group=old.closest('.dcs-thread__group');if(old.parentElement===group)group?.remove();else old.remove();}}
   if(result.task){const back=new URL(result.returnTo,location.origin);if(back.origin!==location.origin||back.pathname!=='/ask-leilia/admin/studio-community/')throw Error('Invalid task return.');back.searchParams.set('completed',result.task);back.searchParams.set('version',String(result.taskVersion));location.assign(back.href);return;}
   forms().forEach(f=>{if(f.hasAttribute('data-edit-form')&&f.dataset.original===undefined)f.dataset.original=f.querySelector<HTMLTextAreaElement>('textarea')?.value??'';});
   const notice=root.querySelector<HTMLElement>('[data-thread-status]');if(notice)notice.textContent=action==='delete'?'Comment deleted.':action==='edit'?'Changes saved.':'Comment posted.';
   const focusTarget=document.getElementById('reply-'+result.id);if(focusTarget){focusTarget.tabIndex=-1;focusTarget.focus({preventScroll:true});}
  }catch{
   // Never echo arbitrary upstream output or private data into diagnostics.
   if(error){error.textContent='Your change could not be confirmed. Your draft is retained. Reload this discussion before retrying if it may have saved.';error.hidden=false;}
  }finally{if(submittedBody)submittedBody.readOnly=false;busy.delete(form);writing=false;root.removeAttribute('aria-busy');forms().forEach(sync);}
 });
}
