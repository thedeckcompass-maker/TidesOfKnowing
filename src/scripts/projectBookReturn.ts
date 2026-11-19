// Navigation only. Existing unsaved-writing guards handle this ordinary link.
const match=location.pathname.match(/^\/studio\/projects\/([a-f0-9-]{36})\//i);
if(match){
 const base='/studio/projects/'+match[1]+'/project-book/',key='studio-book-return:'+match[1];
 const valid=(value:string|null)=>{if(!value)return null;try{const url=new URL(value,location.origin);if(url.origin!==location.origin||url.pathname!==base||!['concept','manuscript','planning'].includes(url.searchParams.get('book')??'concept')||[...url.searchParams.keys()].some(k=>!['book','page'].includes(k))||url.searchParams.has('page')&&!/^[1-9][0-9]{0,4}$/.test(url.searchParams.get('page')!))return null;return url.pathname+url.search+url.hash}catch{return null}};
 let back=valid(new URL(location.href).searchParams.get('book_return'));
 try{if(back)sessionStorage.setItem(key,back);else back=valid(sessionStorage.getItem(key));}catch{/* Reading/editing remains available without tab memory. */}
 if(location.pathname===base){try{sessionStorage.removeItem(key)}catch{}}
 else if(back){const link=document.createElement('a');link.href=back;link.className='project-book-return';link.dataset.returnToBook='';const scope=new URL(back,location.origin).searchParams.get('book');link.textContent='Return to '+(scope==='manuscript'?'Manuscript':scope==='planning'?'Publishing and Launch':'Creative Concept and Setup');document.querySelector('main,.studio-page')?.prepend(link);}
 const field=new URL(location.href).searchParams.get('book_field')?.split(':');
 if(field&&['north-star','response','foundation-output','foundation-response','architecture-output','architecture-response','direction-field'].includes(field[0])&&/^[a-zA-Z0-9_]+$/.test(field[1]??''))setTimeout(()=>{const input=document.querySelector<HTMLElement>('[data-'+field[0]+'="'+field[1]+'"]');if(!input)return;let parent=input.parentElement;while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}input.focus({preventScroll:true});input.scrollIntoView({block:'center'});},150);
}
export {};
