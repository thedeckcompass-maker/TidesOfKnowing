// Transient, same-origin, owner/project-scoped previews. Never writes stored records.
export type BookDraft={tab:string;key:string;sequence:number;at:number;kind:string;cardId?:string;sectionId?:string;dirty:boolean;value:any};
const tab=crypto.randomUUID();let sequence=0;const registrations=new Map<string,()=>void>();
const context=()=>{const owner=document.querySelector<HTMLElement>('[data-studio-owner]')?.dataset.studioOwner,project=location.pathname.match(/\/studio\/projects\/([a-f0-9-]{36})/i)?.[1];return owner&&project?{owner,project}:null};
const c=context();const channel=c&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('studio-book:'+c.owner+':'+c.project):null;
export const sendBookMessage=(message:any)=>{document.dispatchEvent(new CustomEvent('studio-book-message',{detail:message}));channel?.postMessage(message)};
channel?.addEventListener('message',e=>{if(e.data?.type==='request')registrations.forEach(fn=>fn());document.dispatchEvent(new CustomEvent('studio-book-message',{detail:e.data}));});
document.addEventListener('studio-book-request',()=>{registrations.forEach(fn=>fn());channel?.postMessage({type:'request'});});
export function registerBookDraft(options:{root:HTMLElement;key:string;label:string;dirty:()=>boolean;snapshot:()=>any}){
 if(!c||/journal|community|request/i.test(options.label))return;
 const root=options.root,form=root instanceof HTMLFormElement?root:null,action=form?.getAttribute('action')??'';
 const kind=options.label==='final selection'?'selection':/^\/api\/studio\/projects\/[a-f0-9-]{36}\/?$/.test(action)?'project':root.matches('[data-making]')?'production':/\/production\/?$/.test(action)?'production-plan':root.matches('[data-launch]')?'launch':root.matches('[data-deck-visual]')?'visual':options.label==='Visual Design Book'||options.label==='connections and shared visual notes'?'direction':options.label==='companion entry'?'companion':root.matches('[data-guidebook-outline]')?'outline':root.classList.contains('creative-journey')?'journey':/\/cards\//.test(action)?'card':/\/guidebook\//.test(action)?'manuscript':/\/projects\/[^/]+\/cards$/.test(action)?'new-card':/\/projects\/[^/]+\/guidebook$/.test(action)?'new-manuscript':'';
 if(!kind)return;let previous='';const publish=(force=false)=>{const dirty=options.dirty();let value:any=null;try{value=dirty?options.snapshot():null}catch{value={bookPreviewUnavailable:true}}const signature=JSON.stringify({dirty,value});if(!force&&signature===previous)return;previous=signature;const draft:BookDraft={tab,key:options.key,sequence:++sequence,at:Date.now(),kind,cardId:root.dataset.card||action.match(/\/cards\/([^/]+)/)?.[1],sectionId:action.match(/\/guidebook\/([^/]+)/)?.[1],dirty,value};sendBookMessage({type:'draft',draft});};
 registrations.set(options.key,()=>publish(true));root.addEventListener('input',()=>queueMicrotask(()=>publish()));root.addEventListener('change',()=>queueMicrotask(()=>publish()));const timer=setInterval(()=>{if(root.isConnected)publish();else clearInterval(timer)},300);publish();
 window.addEventListener('pagehide',()=>sendBookMessage({type:'clear-tab',tab}));window.addEventListener('pageshow',()=>publish(true));
}
