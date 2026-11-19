/** Keep optional introductory explanation available without putting it ahead of work. */
const journey=document.querySelector<HTMLElement>('.creative-journey');
if(journey){
 for(const panel of journey.querySelectorAll<HTMLElement>('[data-document-panel],[data-making-panel],[data-launch-panel],[data-moment-panel]')){
  const paragraphs:HTMLElement[]=[];
  for(const child of [...panel.children]){
   if(child.matches('label,input,textarea,select,button,form,fieldset'))break;
   if(child.matches('p:not(.studio-eyebrow)')&&!child.querySelector('a,button,input'))paragraphs.push(child as HTMLElement);
  }
  if(paragraphs.reduce((n,p)=>n+(p.textContent?.length??0),0)<120)continue;
  const detail=document.createElement('details');detail.className='studio-step-context';
  const summary=document.createElement('summary');summary.textContent='About this step';detail.append(summary);
  paragraphs[0].before(detail);for(const paragraph of paragraphs)detail.append(paragraph);
 }
}

const companion=journey?.querySelector('[data-chapter-panel=companion]');const companionActions=companion?.querySelector('.companion-create');if(companionActions)companion?.querySelector('h2')?.after(companionActions);

