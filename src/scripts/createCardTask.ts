import {registerStudioDraft} from './studioDraftGuard';
const form=document.querySelector<HTMLFormElement>('[data-card-create]');
if(form){
 const status=form.querySelector<HTMLElement>('[data-create-status]')!,button=form.querySelector<HTMLButtonElement>('[type=submit]')!;
 const key=`studio-new-card:${form.dataset.owner}:${form.dataset.project}`;
 const fields=['title','card_number','family_id','creation_id'];
 const snapshot=()=>Object.fromEntries(fields.map(name=>[name,(form.elements.namedItem(name) as HTMLInputElement).value]));
 const restore=(v:Record<string,string>)=>{for(const name of fields)if(typeof v[name]==='string')(form.elements.namedItem(name) as HTMLInputElement).value=v[name]};
 let busy=false,done=false;
 const dirty=()=>!done&&Boolean(snapshot().title||snapshot().card_number);
 const cache=()=>{try{sessionStorage.setItem(key,JSON.stringify(snapshot()))}catch{}};
 try{const old=JSON.parse(sessionStorage.getItem(key)??'null');if(old&&/^[a-f0-9-]{36}$/i.test(old.creation_id)){restore(old);status.textContent='Your unfinished card is here. Continue when ready.'}}catch{}
 form.addEventListener('input',cache);form.addEventListener('change',cache);
 async function save(continuing=false){if(busy||!form!.reportValidity())return false;busy=true;button.disabled=true;cache();status.textContent='Creating your card…';try{
   const response=await fetch(form!.action,{method:'POST',headers:{Accept:'application/json'},body:new FormData(form!),signal:AbortSignal.timeout(20000)});
   if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Your sign-in or connection needs attention. Your entries are still here.');
   const result=await response.json();if(!response.ok)throw Error(result.error||'Your card could not be created.');
   const url=new URL(result.location,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith(`/studio/projects/${form!.dataset.project}/cards/`))throw Error('The card destination could not be confirmed.');
   done=true;sessionStorage.removeItem(key);if(!continuing)location.assign(url.href);return true;
 }catch(e){status.textContent=(e as Error).message+' Your entries are retained. Retry checks the same card before creating anything.';return false}finally{busy=false;button.disabled=false}}
 form.addEventListener('submit',e=>{e.preventDefault();void save()});
 registerStudioDraft({root:form,key:key+':guard',label:'new card',destination:'this project',fields:'input,select',dirty,save,snapshot,restore,discard:()=>{done=true;sessionStorage.removeItem(key)},message:()=>status.textContent??''});
 window.addEventListener('beforeunload',e=>{if(dirty()){cache();e.preventDefault();e.returnValue=''}});
}
