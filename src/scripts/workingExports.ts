import {productionBook,productionMarkdown} from '../lib/studio/productionBook';
import {launchBook,launchMarkdown} from '../lib/studio/publicationBook';
import {visualFiles} from '../lib/studio/visualExport';
import {zipStored} from '../lib/studio/projectFolder';
export function workingExport(kind:string,project:any,cards:any[]){
 const settings=project.settings??{};
 if(kind==='production')return {name:'my-production-book.md',type:'text/markdown',bytes:productionMarkdown(productionBook(settings,project.deck_type))};
 if(kind==='publication'||kind==='story')return {name:kind==='story'?'my-deck-story-draft.md':'my-publication-and-launch-book.md',type:'text/markdown',bytes:launchMarkdown(launchBook(settings),kind==='story')};
 if(kind==='visual'){const files=visualFiles(project,cards);if(!files.length)throw Error('No saved visual layout is available. Save it in its editor first.');return {name:'visual-design-backup.zip',type:'application/zip',bytes:zipStored(files)};}
 throw Error('Choose a supported export.');
}
const root=typeof document==='undefined'?null:document.querySelector<HTMLElement>('[data-working-exports]');
if(root){
 const state=JSON.parse(root.querySelector('[data-working-export-state]')!.textContent!),status=root.querySelector('[data-working-export-status]')!;
 const download=(name:string,type:string,bytes:string|Uint8Array)=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([bytes as BlobPart],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 root.querySelectorAll<HTMLButtonElement>('[data-working-file]').forEach(b=>b.onclick=()=>{try{const result=workingExport(b.dataset.workingFile!,state.project,state.cards);download(result.name,result.type,result.bytes);status.textContent='Download requested from saved work. Check the file before relying on it.';}catch(e){status.textContent=(e as Error).message;}});
 try{for(const file of visualFiles(state.project,state.cards).filter(f=>f.path.endsWith('/qr.svg'))){const b=document.createElement('button');b.type='button';b.textContent='Download saved card QR: '+(state.cards.find((c:any)=>file.path.includes('/'+c.id+'/'))?.title??'card');b.onclick=()=>download('card-qr.svg','image/svg+xml',file.bytes);root.querySelector('[data-saved-qr]')!.append(b);}}catch{status.textContent='Some saved visual outputs could not be prepared. Keep your existing copies and review the visual editor.';}
}
