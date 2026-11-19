const selector='.studio-utilities,.studio-field-wisdom';
function close(except?:Element|null,restore=false){for(const d of document.querySelectorAll<HTMLDetailsElement>(selector)){if(d===except||!d.open)continue;d.open=false;if(restore)d.querySelector<HTMLElement>('summary')?.focus();}}
document.addEventListener('pointerdown',e=>{const target=e.target as Element;close(target.closest(selector));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const active=(e.target as Element).closest(selector);if(active){e.preventDefault();(active as HTMLDetailsElement).open=false;active.querySelector<HTMLElement>('summary')?.focus();}else close();}});
document.addEventListener('click',e=>{const target=e.target as Element;if(target.closest('a[href]'))close();});
document.addEventListener('toggle',e=>{const d=e.target as HTMLDetailsElement;if(d.matches?.(selector)&&d.open)close(d);},true);
document.addEventListener('studio-chapter-visible',()=>close());window.addEventListener('popstate',()=>close());window.addEventListener('pagehide',()=>close());
function headerOffset(){const header=document.querySelector<HTMLElement>('header.studio-shell');document.documentElement.style.setProperty('--studio-header-offset',`${(header?.getBoundingClientRect().height??0)+20}px`);}
headerOffset();const header=document.querySelector('header.studio-shell');if(header)new ResizeObserver(headerOffset).observe(header);window.addEventListener('resize',headerOffset);

function closeButtonHelp(except?:Element|null){for(const button of document.querySelectorAll<HTMLButtonElement>('.chapter-community-question [data-help][aria-controls]')){const panel=document.getElementById(button.getAttribute('aria-controls')!);if(!panel||panel.hidden||button===except||panel.contains(except??null))continue;panel.hidden=true;button.setAttribute('aria-expanded','false');}}
document.addEventListener('pointerdown',e=>closeButtonHelp(e.target as Element));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeButtonHelp();});document.addEventListener('studio-chapter-visible',()=>closeButtonHelp());document.addEventListener('click',e=>{if((e.target as Element).closest('a[href]'))closeButtonHelp();});
