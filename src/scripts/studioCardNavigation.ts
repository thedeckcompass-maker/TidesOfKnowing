// Tab-local list navigation memory: no manuscript content is stored here.
const workspace=document.querySelector<HTMLElement>('[data-studio-card-workspace]');
if(workspace){
 const owner=workspace.dataset.ownerId,project=workspace.dataset.projectId,key=owner&&project?'studio-card-list:'+owner+':'+project:null;
 const search=workspace.querySelector<HTMLInputElement>('[data-studio-card-search] input');
 type ListState={query:string;y:number;family:string;card:string;offset:number;returning:boolean};
 let state:ListState={query:'',y:0,family:'',card:'',offset:0,returning:false};
 if(key)try{const v=JSON.parse(sessionStorage.getItem(key)??'null');if(v&&typeof v.query==='string')state={query:v.query.slice(0,300),y:Number.isFinite(v.y)?Math.max(0,v.y):0,family:typeof v.family==='string'?v.family:'',card:typeof v.card==='string'?v.card:'',offset:Number.isFinite(v.offset)?v.offset:0,returning:v.returning===true}}catch{}
 const persist=()=>{if(key)try{sessionStorage.setItem(key,JSON.stringify(state))}catch{}};
 let restoring=false;
 const record=()=>{if(restoring)return;state.query=search?.value??'';state.y=scrollY;if(location.hash.startsWith('#family-'))state.family=location.hash;persist()};
 search?.addEventListener('input',record);window.addEventListener('pagehide',record);
 workspace.addEventListener('click',event=>{const a=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');if(!a||event.defaultPrevented)return;const u=new URL(a.href,location.origin),row=a.closest<HTMLElement>('[data-card-id]');if(row&&u.origin===location.origin&&u.pathname.startsWith('/studio/projects/'+project+'/cards/')){record();state.card=row.dataset.cardId??'';state.offset=row.getBoundingClientRect().top;state.returning=true;persist()}if(a.hash.startsWith('#family-')){state.family=a.hash;persist()}});
 const show=()=>{if(search&&search.value!==state.query){restoring=true;search.value=state.query;search.dispatchEvent(new Event('input',{bubbles:true}));restoring=false}if(location.hash==='#add-card'){requestAnimationFrame(()=>{document.getElementById('add-card')?.scrollIntoView({behavior:'instant'});workspace.querySelector<HTMLInputElement>('#add-card input[name=title]')?.focus({preventScroll:true})});return}if(location.hash==='#project-administration'){const d=document.getElementById('project-administration');if(d instanceof HTMLDetailsElement)d.open=true;return}if(state.returning&&(!location.hash||location.hash==='#cards'||location.hash.startsWith('#family-'))){const target=Array.from(workspace.querySelectorAll<HTMLElement>('[data-card-id]')).find(e=>e.dataset.cardId===state.card);requestAnimationFrame(()=>requestAnimationFrame(()=>{scrollTo({top:target&&!target.hidden?scrollY+target.getBoundingClientRect().top-state.offset:state.y,behavior:'instant'});state.returning=false;persist()}))}};
 window.addEventListener('pageshow',show);window.addEventListener('hashchange',show);setTimeout(show,0);
 document.addEventListener('click',event=>{const a=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');if(!a||event.defaultPrevented)return;const u=new URL(a.href,location.origin);if(u.pathname===location.pathname&&u.hash==='#add-card')setTimeout(show,0)});
}
