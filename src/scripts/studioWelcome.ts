const root=document.querySelector<HTMLElement>('[data-orientation]');
if(root){
 const initial=JSON.parse(root.querySelector('[data-orientation-initial]')!.textContent!);
 let state=initial,position=state.position,busy=false,pending:{action:string;position:number}|null=null;
 const key='studio-orientation-position:'+root.dataset.owner;
 const status=root.querySelector<HTMLElement>('[data-welcome-status]')!;
 const cache=(action='position')=>{try{sessionStorage.setItem(key,JSON.stringify({position,action}));if(['finish','dismiss'].includes(action))localStorage.setItem(key,JSON.stringify({position,action}));}catch{}};
 try{const saved=JSON.parse(sessionStorage.getItem(key)??'null');if(saved&&Number.isInteger(saved.position)&&saved.position>=0&&saved.position<=5)position=saved.position;}catch{}
 if(location.hash==='#chapters')position=3;if(location.hash==='#personal-welcome')position=0;
 const render=()=>{root.querySelectorAll<HTMLElement>('[data-welcome-panel]').forEach(e=>e.hidden=Number(e.dataset.welcomePanel)!==position);root.querySelectorAll<HTMLElement>('[data-welcome-position]').forEach(e=>{if(Number(e.dataset.welcomePosition)===position)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');});root.querySelector<HTMLButtonElement>('[data-welcome-back]')!.hidden=position===0;root.querySelector<HTMLButtonElement>('[data-welcome-next]')!.hidden=position===5;};
 // Optional reading-position tracking never gates navigation or saves written work.
 async function persist(){if(root?.dataset.serverProgress!=='true'){pending=null;return;}if(busy||!pending)return;const next=pending;pending=null;busy=true;try{const response=await fetch('/api/studio/orientation',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({...next,expectedRevision:state.revision})});if(response.ok){const result=await response.json();state=result.state;}}catch{/* The per-user tab cache still permits returning to this section. */}finally{busy=false;if(pending)void persist();}}
 const choose=(value:number)=>{position=Math.max(0,Math.min(5,value));render();cache();pending={action:'position',position};void persist();const heading=root.querySelector<HTMLElement>('[data-welcome-panel]:not([hidden]) h2')??root.querySelector<HTMLElement>('.welcome-heading');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});}};
 root.querySelectorAll<HTMLElement>('[data-welcome-position]').forEach(e=>e.addEventListener('click',()=>choose(Number(e.dataset.welcomePosition))));
 root.querySelector('[data-welcome-back]')!.addEventListener('click',()=>choose(position-1));root.querySelector('[data-welcome-next]')!.addEventListener('click',()=>choose(position+1));
 root.querySelectorAll<HTMLAnchorElement>('[data-orientation-exit]').forEach(a=>a.addEventListener('click',e=>{const destination=new URL(a.href,location.origin);if(destination.origin!==location.origin||!destination.pathname.startsWith('/studio/')){e.preventDefault();status.textContent='Choose a Studio destination from the links on this page.';return;}cache(a.dataset.orientationExit);pending={action:a.dataset.orientationExit!,position};void persist();}));
 render();status.textContent='';
}
