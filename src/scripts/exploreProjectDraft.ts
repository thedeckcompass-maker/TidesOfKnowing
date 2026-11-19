import {registerStudioDraft} from './studioDraftGuard';
import {sameWriting} from '../lib/studio/saveState';

// One creation handler owns both recovery and the shared unsaved-work guard.
const form=document.querySelector<HTMLFormElement>('[data-explore-project-draft]');
if(form&&form.dataset.owner){
 const key=`studio-project-draft:${form.dataset.owner}`;
 const names=['request_id','task','book','name','deck_type','pathway','deck_size','purpose'];
 const fields=()=>names.map(name=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|null).filter((f):f is HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement=>!!f);
 const read=()=>Object.fromEntries(fields().map(f=>[f.name,f.value]));
 const restore=(value:unknown)=>{if(value&&typeof value==='object')for(const f of fields()){const v=(value as Record<string,unknown>)[f.name];if(typeof v==='string')f.value=v;}};
 let confirmed=read(),busy=false,lastDestination='';
 const dirty=()=>!sameWriting(read(),confirmed);
 try{restore(JSON.parse(sessionStorage.getItem(key)??'null'));}catch{/* Keep the form usable when browser recovery is unavailable. */}
 const cache=()=>{try{if(dirty())sessionStorage.setItem(key,JSON.stringify(read()));else sessionStorage.removeItem(key);}catch{}};
 form.addEventListener('input',cache);form.addEventListener('change',cache);
 const status=form.querySelector<HTMLElement>('[data-project-create-status]');
 const button=form.querySelector<HTMLButtonElement>('button[type=submit]');
 const save=async()=>{
  if(busy||!form.reportValidity())return false;
  if(lastDestination&&!dirty())return true;
  busy=true;cache();form.inert=true;if(button)button.disabled=true;if(status)status.textContent='Creating your project…';
  const submitted=read();
  try{
   const response=await fetch(form.action,{method:'POST',headers:{Accept:'application/json'},body:new FormData(form),signal:AbortSignal.timeout(20000)});
   if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Your sign-in or connection needs attention.');
   const result=await response.json();if(!response.ok)throw Error(result.error||'The project could not be created.');
   const destination=new URL(result.location,location.origin);
   if(destination.origin!==location.origin||!/^\/studio\/projects\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}(?:\/|$)/i.test(destination.pathname)||destination.pathname.split('/')[3]!==submitted.request_id)throw Error('The project destination could not be confirmed.');
   // Clear only the acknowledged snapshot before navigation fires beforeunload.
   confirmed=submitted;lastDestination=destination.href;cache();
   document.dispatchEvent(new CustomEvent('studio-project-saved'));
   if(status)status.textContent=dirty()?'Your project was created. Newer edits remain unsaved.':'Your project was created.';
   return !dirty();
  }catch(error){if(status)status.textContent=(error as Error).message+' Your details remain here.';return false;}
  finally{busy=false;form.inert=false;if(button)button.disabled=false;}
 };
 registerStudioDraft({root:form,key:key+':guard',label:'new project',destination:'your saved project records',fields:'textarea,input:not([type=hidden]),select',dirty,save,snapshot:read,restore:value=>{restore(value);cache();},discard:()=>{restore(confirmed);cache();},message:()=>status?.textContent??''});
 form.addEventListener('submit',async event=>{event.preventDefault();if(await save())location.assign(lastDestination);});
}
