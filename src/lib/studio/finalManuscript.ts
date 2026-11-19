import {selectedCards} from './finalSelection';
import {guidebookOutline,outlineSlots,hasRecurringWriting} from './guidebookOutline';
import {companionOrder,companionState} from './companion';
import {bookMatter,bookMatterText,bookSurfaceApplicable} from './bookMatter';
export async function finalManuscript(project:any,cards:any[],sections:any[],deletedCardIds:string[]=[]){
 const selected=selectedCards(project.settings,cards,deletedCardIds),ids=new Set(selected.map(c=>c.id)),outline=guidebookOutline(project.settings);
 const relevant=companionOrder(sections).filter(s=>(!s.card_id||ids.has(s.card_id))&&!['front-cover','inside-front','inside-back','back-cover','spine'].includes(bookMatter(s).surface)&&bookSurfaceApplicable(s,sections));
 if(hasRecurringWriting(project.settings)&&(outline.approval?.revision!==outline.revision||outline.approval?.by!==project.owner_id))throw Error('Recurring guidebook writing needs explicit creator approval for its current revision. No incomplete final manuscript was issued.');
 for(const section of relevant){if(!bookMatterText(section,sections).trim())continue;if(!(await companionState(section,cards.find(c=>c.id===section.card_id),sections)).approved)throw Error('An included entry or its shared book details changed or needs creator approval. Review it before final export.');}
 const entries=selected.map(card=>{const recurring=outlineSlots(outline,card.id).filter(s=>s.text.trim()),linked=relevant.filter(s=>s.card_id===card.id&&bookMatterText(s,sections).trim());if(!recurring.length&&!linked.length)throw Error(`An included card has no reader-facing manuscript: ${card.title}. Write it or set it aside before final export.`);return `## ${card.card_number?card.card_number+' - ':''}${card.title}\n\n`+recurring.map(s=>`### ${s.label}\n\n${s.text}`).join('\n\n')+'\n\n'+linked.map(s=>`### ${s.title}\n\n${bookMatterText(s,sections)}`).join('\n\n')});
 const parts:{front:string[];body:string[];back:string[]}={front:[],body:[],back:[]};let placed=false;
 for(const section of relevant.filter(s=>!s.card_id)){const matter=bookMatter(section),text=bookMatterText(section,sections);if(text.trim())parts[matter.placement].push(`## ${section.title}\n\n${text}`);if(matter.surface==='card-entries'){if(placed)throw Error('Choose one card-entry position before exporting.');parts[matter.placement].push(...entries);placed=true;}}
 if(!placed)parts.body.push(...entries);
 return {count:selected.length,text:`# ${project.name} - Final creator-approved manuscript\n\n`+[...parts.front,...parts.body,...parts.back].join('\n\n')};
}
