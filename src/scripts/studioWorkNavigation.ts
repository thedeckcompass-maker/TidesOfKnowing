import {communityWorkContext,isCommunityPath} from '../lib/studio/communityNavigation';
const shell=document.querySelector<HTMLElement>('[data-studio-owner]');
if(shell){
 const context=()=>{
  if(isCommunityPath(location.pathname))return communityWorkContext(shell.dataset.workReturn??null);
  const work=new URL(location.href),journey=document.querySelector<HTMLElement>('.creative-journey');
  if(journey?.dataset.currentChapter){work.searchParams.set('chapter',journey.dataset.currentChapter);const active=document.querySelector<HTMLElement>('[data-document-panel]:not([hidden]),[data-making-panel]:not([hidden]),[data-launch-panel]:not([hidden])');const moment=active?.dataset.step??active?.dataset.makingPanel??active?.dataset.launchPanel??document.querySelector<HTMLElement>('[data-moment][aria-current="step"]')?.dataset.moment;if(moment)work.searchParams.set('moment',moment);}
  const candidate=communityWorkContext(work.pathname+work.search+work.hash);
  return candidate?.projectId===shell.dataset.project?candidate:null;
 };
 document.addEventListener('click',event=>{
  const a=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');if(!a)return;
  const target=new URL(a.href,location.href);if(target.origin!==location.origin||!isCommunityPath(target.pathname))return;
  const c=context();target.searchParams.delete('from');if(c)target.searchParams.set('from',c.returnTo);
  if(c?.chapter&&target.pathname==='/studio/community/')target.searchParams.set('chapter',c.chapter);
  a.href=target.pathname+target.search+target.hash;
 });
}
