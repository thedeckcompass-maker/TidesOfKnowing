export type OutlineSection = {id:string;label:string;archived:boolean};
export type Outline = {version:1;revision:number;sections:OutlineSection[];writing:Record<string,Record<string,string>>;history:unknown[];setupConfirmed?:boolean;approval?:{revision:number;by:string;at:string}};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function guidebookOutline(settings:any):Outline {
 const value=settings?.guidebook_outline_v1;
 if(!value)return {version:1,revision:0,sections:[],writing:{},history:[]};
 if(value.version!==1||!Array.isArray(value.sections)||!value.writing||!Array.isArray(value.history))throw Error('This outline format needs review. Nothing was replaced.');
 return value;
}
export function outlineSlots(outline:Outline,cardId:string){return outline.sections.filter(s=>!s.archived).map(s=>({...s,text:outline.writing[cardId]?.[s.id]??''}));}
export function prepareOutline(settings:any,input:any,cardIds:Set<string>,at:string,actor?:string){
 const prior=guidebookOutline(settings);
 if(input.expectedRevision!==prior.revision)throw Error('The outline changed in another tab. Keep your draft and reopen before retrying.');
 const next:Outline=structuredClone(prior);
 if(input.action==='outline'){
  if(!Array.isArray(input.sections)||input.sections.length>80)throw Error('Keep up to 80 sections, including archived sections.');
  const ids=new Set<string>();
  next.sections=input.sections.map((s:any)=>{if(!s||!uuid.test(s.id)||ids.has(s.id)||typeof s.label!=='string'||!s.label.trim()||s.label.length>120||typeof s.archived!=='boolean')throw Error('Check each section name and identity.');ids.add(s.id);return {id:s.id,label:s.label.trim(),archived:s.archived};});
  for(const section of next.sections){const old=prior.sections.find(s=>s.id===section.id);if(old&&!old.archived&&section.archived&&Object.values(prior.writing).some(values=>String(values[section.id]??'').trim()))throw Error('This section contains writing. Review each affected card and move or clear its text before removing it.');}if(input.confirmSetup===true)next.setupConfirmed=true;
  if(prior.sections.some(s=>!ids.has(s.id)))throw Error('Archive a section instead of removing its identity. Its writing must be preserved.');
 }else if(input.action==='writing'){
  if(!prior.setupConfirmed&&!Object.values(prior.writing).some(values=>Object.values(values).some(text=>text.trim())))throw Error('Confirm your card-entry structure in setup before writing these shared sections. Quick card notes remain available.');
  if(!cardIds.has(input.cardId))throw Error('Choose a card in this project.');
  if(!input.values||typeof input.values!=='object'||Array.isArray(input.values))throw Error('Check the card writing.');
  const values={...(next.writing[input.cardId]??{})};
  for(const [id,value]of Object.entries(input.values)){if(!next.sections.some(s=>s.id===id&&!s.archived)||typeof value!=='string'||value.length>20000)throw Error('A section changed or its writing is too long. Nothing was shortened.');values[id]=value;}
  next.writing[input.cardId]=values;
  }else if(input.action==='approve'){
  if(!actor||input.confirmApproval!==true||!hasRecurringWriting(settings))throw Error('Review the recurring writing and explicitly confirm creator approval.');
  next.approval={revision:prior.revision+1,by:actor,at};
 }else throw Error('Choose an outline, writing or approval action.');
 if(JSON.stringify(next)===JSON.stringify(prior))return settings;
 next.history.push({at,revision:prior.revision,sections:prior.sections,writing:prior.writing,approval:prior.approval??null});next.revision++;
 const result={...settings,guidebook_outline_v1:next};
 if(JSON.stringify(result).length>6500000)throw Error('This project needs a history backup before more writing can be saved. No history was removed.');
 return result;
}
export function outlineManuscript(project:any,cards:any[]){const outline=guidebookOutline(project.settings);if(!outline.sections.some(s=>!s.archived))return '';return cards.map(card=>`## ${card.card_number?card.card_number+' - ':''}${card.title}\n\n`+outlineSlots(outline,card.id).map(s=>`### ${s.label}\n\n${s.text}`).join('\n\n')).join('\n\n');}
export function hasRecurringWriting(settings:any){const o=guidebookOutline(settings);return Object.values(o.writing).some(values=>o.sections.some(s=>!s.archived&&Boolean(values[s.id]?.trim())));}
export function restoreOutline(value:any,map:Record<string,string>){
 const outline=structuredClone(guidebookOutline({guidebook_outline_v1:value}));
 function check(state:any){if(!Array.isArray(state.sections)||!state.writing||typeof state.writing!=='object'||Array.isArray(state.writing))throw Error('Invalid guidebook outline backup.');const ids=new Set<string>();for(const s of state.sections){if(!uuid.test(s.id)||ids.has(s.id)||typeof s.label!=='string'||typeof s.archived!=='boolean')throw Error('Invalid guidebook section identity.');ids.add(s.id)}const writing:Record<string,Record<string,string>>={};for(const [card,values]of Object.entries(state.writing)){if(!map[card]||!values||typeof values!=='object'||Array.isArray(values))throw Error('Guidebook writing refers to a card outside the restored project.');for(const [id,text]of Object.entries(values)){if(!ids.has(id)||typeof text!=='string')throw Error('Invalid guidebook writing slot.')}writing[map[card]]=values as Record<string,string>;}state.writing=writing;}
 delete outline.approval;check(outline);for(const history of outline.history)check(history);return outline;
}
