import {registerStudioDraft} from './studioDraftGuard';
import {sameWriting} from '../lib/studio/saveState';
// Saving a conversation draft must never mean submitting it to an audience.
const owner=document.querySelector<HTMLElement>('[data-studio-owner]')?.dataset.studioOwner;
if(owner)document.querySelectorAll<HTMLFormElement>('[data-support-form],[data-editorial-form],#studio-journey-update').forEach((form,index)=>{
  const sourceEntry=new URLSearchParams(location.search).get('entry')??'';const key='private-question-draft:'+owner+':'+location.pathname+':'+(form.id==='studio-journey-update'?sourceEntry:'')+':'+index;const label=form.id==='studio-journey-update'?'journey update':'private question';
  const fields=()=>Array.from(form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('textarea,input:not([type]),input[type=text],select'));
  const read=()=>fields().map((field,i)=>({i,name:field.name,value:field.value}));
  let confirmed=read();
  // Contextual chapter defaults are navigation, not authored question text.
  const dirty=()=>fields().some(field=>field.tagName!=='SELECT'&&field.value.trim())&&!sameWriting(read(),confirmed);
  const restore=(value:any)=>{if(!Array.isArray(value))throw Error('Invalid draft.');for(const item of value){const field=fields()[item.i];if(field&&field.name===item.name&&typeof item.value==='string')field.value=item.value;}form.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(e=>e.checked=false);form.dispatchEvent(new Event('input',{bubbles:true}));};
  const notice=document.createElement('p');notice.setAttribute('role','status');form.append(notice);
  const cache=()=>{try{sessionStorage.setItem(key+':unsaved',JSON.stringify(read()))}catch{notice.textContent='This draft remains on the page; browser recovery is unavailable.'}};
  document.addEventListener('studio-writing-saved',((event:CustomEvent)=>{if(form.id&&event.detail.formId===form.id){confirmed=read();try{sessionStorage.removeItem(key);sessionStorage.removeItem(key+':unsaved')}catch{}}}) as EventListener);
  form.addEventListener('input',cache);form.addEventListener('change',cache);
  try{const raw=sessionStorage.getItem(key+':unsaved')??sessionStorage.getItem(key);if(raw){const recover=document.createElement('button');recover.type='button';recover.className='studio-text-button';recover.textContent='Recover private question draft';recover.onclick=()=>{restore(JSON.parse(raw));notice.textContent='Recovered for editing only. Review the audience and selected material again before submission.';recover.remove()};form.before(recover)}}catch{}
  registerStudioDraft({root:form,key:key+':guard',label,destination:'a private draft in this browser tab — not a submitted request',fields:'textarea,input:not([type]),input[type=text],select',dirty,save:async()=>{try{sessionStorage.setItem(key,JSON.stringify(read()));confirmed=read();notice.textContent='Private browser draft saved. No question, request or notification was sent.';return true}catch{notice.textContent='Draft storage failed. Keep this page open; nothing was sent.';return false}},snapshot:read,restore,discard:()=>{restore(confirmed);sessionStorage.removeItem(key+':unsaved')},message:()=>notice.textContent??''});
});
