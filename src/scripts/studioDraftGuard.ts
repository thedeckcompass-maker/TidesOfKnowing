import {registerBookDraft} from './projectBookDrafts';
import '../styles/studioDraftGuard.css';

export type StudioDraft = {
  root: HTMLElement;
  key: string;
  label: string;
  destination: string;
  fields: string;
  dirty: () => boolean;
  save: (continuing?: boolean) => Promise<boolean>;
  priority?: number;
  snapshot: () => unknown;
  restore: (value: any) => void;
  discard: () => void;
  message?: () => string;
};
type Entry = StudioDraft & { bar: HTMLElement; refresh: () => void; focus?: HTMLElement };
const drafts: Entry[] = [];
let installed = false, allowClick: Element | null = null;
const changed = () => drafts.filter(d => d.root.isConnected && d.dirty());
const button = (text: string) => { const b = document.createElement('button'); b.type='button'; b.className='studio-button studio-button--secondary'; b.textContent=text; return b; };

export function registerStudioDraft(options: StudioDraft) {
  const bar = document.createElement('div'); bar.className='studio-draft-context'; bar.dataset.draftContext=options.label;
  const state=document.createElement('p'),recover=button('Recover discarded draft from this tab');
  state.setAttribute('role','status'); state.setAttribute('aria-live','polite');
  const storage='studio-discarded:'+options.key;
  const copies=()=>{const raw=sessionStorage.getItem(storage);if(!raw)return [];const parsed=JSON.parse(raw);return parsed.copies??[parsed]};
  const select=document.createElement('select');select.setAttribute('aria-label','Discarded draft to recover');select.hidden=true;
  const refresh=()=>{state.textContent=options.dirty()?options.label+': Unsaved changes.':options.label+': No unsaved changes.';try{const values=copies(),old=select.value;recover.hidden=!values.length;select.hidden=values.length<2;select.replaceChildren(...values.map((v:any,i:number)=>{const option=document.createElement('option');option.value=String(i);option.textContent='Discarded draft '+(i+1)+' — '+new Date(v.at).toLocaleString();return option}));select.value=old&&Number(old)<values.length?old:String(values.length-1);bar.hidden=!values.length}catch{recover.hidden=true;select.hidden=true}};
  const entry:Entry={...options,bar,refresh}; drafts.push(entry);
  recover.addEventListener('click',()=>{try{const values=copies(),copy=values[Number(select.value)]??values[values.length-1];if(!copy)return;if(options.dirty()){if(!window.confirm('Keep a recovery copy of your current unsaved draft, then open the selected discarded draft?'))return;const value=JSON.stringify({copies:values.concat({at:new Date().toISOString(),draft:options.snapshot()})});if(value.length>4000000)throw Error('Recovery storage is full. Keep editing your current draft.');sessionStorage.setItem(storage,value)}options.restore(copy.draft);refresh();state.textContent='Recovered discarded draft. Review and save; newer saved work is protected by the normal version check.';}catch{state.textContent='This recovery copy could not be opened. Your current draft and saved work were not changed.';}});
  bar.append(state,select,recover);bar.hidden=true;options.root.append(bar);
  options.root.addEventListener('focusin',event=>{const target=event.target as HTMLElement;if(!target.matches(options.fields))return;entry.focus=target;refresh()});
  options.root.addEventListener('input',()=>queueMicrotask(refresh));options.root.addEventListener('change',()=>queueMicrotask(refresh));
  document.addEventListener('studio-project-saved',()=>queueMicrotask(refresh));document.addEventListener('studio-writing-saved',()=>queueMicrotask(refresh));
  try{if(sessionStorage.getItem(storage)){options.root.prepend(bar);bar.hidden=false;refresh()}}catch{}
  registerBookDraft(options);install();return {refresh};
}

function install(){if(installed)return;installed=true;
  const dialog=document.createElement('dialog');dialog.className='studio-draft-dialog';dialog.dataset.draftDialog='';
  const heading=document.createElement('h2');heading.id='studio-draft-dialog-title';heading.textContent='Save your changes before continuing?';dialog.setAttribute('aria-labelledby',heading.id);
  const description=document.createElement('p'),status=document.createElement('p'),actions=document.createElement('div');status.setAttribute('role','status');status.setAttribute('aria-live','polite');actions.className='studio-draft-dialog-actions';
  const save=button('Save changes and continue'),keep=button('Keep editing'),discard=button('Discard changes and continue');
  const note=document.createElement('p');note.textContent='Discard keeps a recovery copy in this browser tab. It does not delete saved records or history. Browser Back, reload and closing may use the browser’s own leave warning.';
  actions.append(save,keep,discard);dialog.append(heading,description,status,actions,note);document.body.append(dialog);
  let target:HTMLElement|null=null,targetHref:string|null=null,busy=false;
  const close=()=>{dialog.close();target=null;targetHref=null;changed()[0]?.focus?.focus()};
  const proceed=()=>{const next=target,href=targetHref;dialog.close();target=null;targetHref=null;if(next?.isConnected){allowClick=next;try{next.click();}finally{allowClick=null}}else if(href){location.assign(href)}};
  const lock=(value:boolean)=>{busy=value;save.disabled=value;keep.disabled=value;discard.disabled=value};
  keep.onclick=close;dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();else{e.preventDefault();close()}});
  save.onclick=async()=>{lock(true);status.textContent='Confirming each section save…';try{for(const d of changed().sort((a,b)=>(a.priority??0)-(b.priority??0))){if(!d.dirty())continue;if(!await d.save(true)){status.textContent=d.message?.()||'Save not confirmed for '+d.label+'. Your draft remains here.';return}}if(changed().length){status.textContent='Newer edits remain unsaved. Keep editing or try saving again.';return}proceed();}catch(e){status.textContent='Could not confirm save. '+(e as Error).message+' Your draft remains here.';}finally{lock(false)}};
  discard.onclick=()=>{lock(true);try{const pending=changed();for(const d of pending){const key='studio-discarded:'+d.key,prior=sessionStorage.getItem(key),parsed=prior?JSON.parse(prior):null,copies=parsed?.copies??(parsed?[parsed]:[]),value=JSON.stringify({copies:copies.concat({at:new Date().toISOString(),draft:d.snapshot()})});if(value.length>4000000)throw Error('Download this large draft before discarding.');sessionStorage.setItem('studio-discarded:'+d.key,value)}for(const d of pending){d.discard();d.refresh()}if(changed().length)throw Error('Some edits still need attention.');proceed();}catch(e){status.textContent=(e as Error).message+' Nothing further was discarded; keep editing.';}finally{lock(false)}};
  document.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const element=(event.target as HTMLElement).closest<HTMLElement>('a[href],button');if(!element||dialog.contains(element))return;if(allowClick===element)return;
    let navigates=element.matches('[data-chapter],[data-moment],[data-next],#next-moment,[data-document-moment],[data-document-next],[data-making-step],[data-making-next],[data-launch-step],[data-launch-next],[data-studio-navigate]');
    if(element instanceof HTMLAnchorElement){if(element.target==='_blank'||element.hasAttribute('download'))return;const url=new URL(element.href,location.origin);if(url.origin!==location.origin)return;if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;navigates=true;}
    if(!navigates||!changed().length)return;event.preventDefault();event.stopImmediatePropagation();if(dialog.open)return;target=element;targetHref=element instanceof HTMLAnchorElement?element.href:null;description.textContent=changed().map(d=>d.label+' → '+d.destination).join('; ');status.textContent='Nothing has been saved or discarded by opening this message.';dialog.showModal();keep.focus();
  },true);
  window.addEventListener('beforeunload',event=>{if(changed().length){event.preventDefault();event.returnValue=''}});
}
