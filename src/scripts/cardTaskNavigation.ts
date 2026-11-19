const tabs=[...document.querySelectorAll<HTMLButtonElement>('[data-card-task]')];
function show(task:string){for(const tab of tabs)tab.setAttribute('aria-pressed',String(tab.dataset.cardTask===task));document.querySelectorAll<HTMLElement>('[data-card-task-panel]').forEach(p=>p.hidden=p.dataset.cardTaskPanel!==task);}
for(const tab of tabs)tab.onclick=()=>{const u=new URL(location.href);u.searchParams.set('task',tab.dataset.cardTask!);history.replaceState(null,'',u);show(tab.dataset.cardTask!)};
show(new URL(location.href).searchParams.get('task')==='artwork'?'artwork':'writing');
export {};

document.addEventListener('studio-project-saved',((event:CustomEvent)=>{if(event.detail.source==='visual'){const next=document.querySelector<HTMLElement>('[data-artwork-continue]');if(next)next.hidden=false}}) as EventListener);
