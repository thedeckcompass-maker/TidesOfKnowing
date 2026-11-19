import {inboxId} from '../lib/studio/communityInbox';
const root=document.querySelector<HTMLElement>('[data-inbox]');
if(root){
 let writing=false,uncertain=false;
 const status=root.querySelector<HTMLElement>('[data-inbox-status]');
 const say=(s:string)=>{if(status)status.textContent=s;};
 const send=async(p:any)=>{const r=await fetch('/api/studio/community-inbox',{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const v=await r.json();if(!r.ok||v.saved!==true||v.id!==p.key)throw Error('unconfirmed');return v;};
 const dialog=root.querySelector<HTMLDialogElement>('[data-command-dialog]')!;
 function confirmAction(action:string,count:number):Promise<string|null>{
  const needed=['hide','restore','lock','unlock','dismiss'].includes(action),area=dialog.querySelector<HTMLTextAreaElement>('textarea')!;
  area.value='';area.required=needed;dialog.querySelector<HTMLElement>('[data-reason-label]')!.hidden=!needed;
  dialog.querySelector('[data-command-title]')!.textContent=action==='done'?'Mark '+count+' item(s) done?':action==='undo'?'Return this task to Inbox?':action[0].toUpperCase()+action.slice(1)+' '+count+' item(s)?';
  dialog.querySelector('[data-command-description]')!.textContent=action==='hide'?'Content and authorship are preserved. Hiding is reversible. Unfinished work leaves the Inbox until content is restored.':action==='undo'?'Only task completion is undone. A saved reply stays published.':action==='dismiss'?'Dismiss this report with a reason. The content stays as it is.':'Task status and content visibility remain independent.';
  dialog.showModal();return new Promise(resolve=>{const f=dialog.querySelector('form')!;const listener=(e:SubmitEvent)=>{e.preventDefault();const choice=(e.submitter as HTMLButtonElement)?.value;if(choice==='confirm'&&!f.reportValidity())return;f.removeEventListener('submit',listener);dialog.close();resolve(choice==='confirm'?(needed?area.value:''):null);};f.addEventListener('submit',listener);dialog.addEventListener('cancel',()=>{f.removeEventListener('submit',listener);resolve(null);},{once:true});});
 }
 const row=(e:Element)=>{const el=e.closest<HTMLElement>('[data-inbox-row]');return el?JSON.parse(el.dataset.task!):null;};
 root.querySelector<HTMLInputElement>('[data-select-page]')?.addEventListener('change',e=>root.querySelectorAll<HTMLInputElement>('[data-select-task]').forEach(b=>b.checked=(e.target as HTMLInputElement).checked));
 root.addEventListener('click',async e=>{
  const target=(e.target as Element).closest<HTMLElement>('button,a');if(!target)return;
  const opening=target.hasAttribute('data-open-task'),action=target.dataset.taskAction??target.dataset.bulk;
  if(!opening&&!action&&!target.hasAttribute('data-undo-return'))return;
  const single=row(target);if(opening&&single?.moderation_only)return;
  e.preventDefault();if(writing||uncertain)return;
  let rows=single?[single]:[...root.querySelectorAll<HTMLInputElement>('[data-select-task]:checked')].map(b=>row(b));
  let act=opening?'open':action;
  if(target.hasAttribute('data-undo-return')){const q=new URLSearchParams(location.search),id=q.get('completed'),version=Number(q.get('version'));if(!inboxId(id)||!Number.isSafeInteger(version)||version<1)return;rows=[{id,version}];act='undo';}
  if(!rows.length||rows.length>25){say('Choose between 1 and 25 items.');return;}
  if(act==='done'&&rows.some(r=>r.kind==='report')){say('Reports need an explicit Hide or Dismiss action with a reason.');return;}
  const reason=opening?'':await confirmAction(act!,rows.length);if(reason===null)return;
  writing=true;
  try{
   if(single?.moderation_only){const p=new FormData();Object.entries({action:'moderate',post_id:single.thread_id,reply_id:single.reply_id??'',expected:single.updated_at,key:crypto.randomUUID(),transition:act!,reason}).forEach(([k,v])=>p.set(k,v));const r=await fetch('/api/studio/community-completion',{method:'POST',credentials:'same-origin',redirect:'error',body:p});const v=await r.json();if(!r.ok||!inboxId(v.id))throw Error('unconfirmed');}
   else await send({action:act,key:crypto.randomUUID(),items:rows.map(r=>({id:r.id,version:r.version,expected:r.updated_at})),...(reason?{reason}:{})});
   if(opening)location.assign((target as HTMLAnchorElement).href);else location.reload();
  }catch{uncertain=true;say('The result could not be confirmed. Refresh and check before another action. Nothing will be retried automatically.');}
  finally{writing=false;}
 });
 // Preserved hidden threads retain the existing guarded moderation form and receipt contract.
 root.querySelectorAll<HTMLFormElement>('[data-admin-moderation]').forEach(form=>{
  const field=(n:string)=>form.elements.namedItem(n) as HTMLInputElement;
  form.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('button');if(b?.dataset.chooseAction){field('transition').value=b.dataset.chooseAction;form.querySelector<HTMLElement>('[data-action-fields]')!.hidden=false;form.querySelector('[data-confirm-action]')!.textContent='Confirm '+b.dataset.chooseAction;}if(b?.hasAttribute('data-cancel-action'))form.querySelector<HTMLElement>('[data-action-fields]')!.hidden=true;});
  form.addEventListener('submit',async e=>{e.preventDefault();if(writing||uncertain||!form.reportValidity())return;const payload=new FormData(form);writing=true;try{const r=await fetch('/api/studio/community-completion',{method:'POST',credentials:'same-origin',redirect:'error',body:payload});const v=await r.json();if(!r.ok||!inboxId(v.id)||typeof v.unchanged!=='boolean')throw Error('unconfirmed');location.reload();}catch{uncertain=true;say('Action not confirmed. Refresh and check before another action.');}finally{writing=false;}});
 });
}
