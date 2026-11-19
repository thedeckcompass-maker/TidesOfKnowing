import {visualQrSvg,qrDestination,workingCardSvg} from './visualExport';
import {bookMatter,bookMatterText,bookSurfaceApplicable,resolvedBookFields} from './bookMatter';
import {guidebookOutline,outlineSlots} from './guidebookOutline';
// Reading projections only. Source records, approvals and backups are unchanged.
export function projectBookDocuments(data:any){
 const copy=structuredClone(data.chapters),cards=data.sources?.cards??[];
 const expression=copy.find((c:any)=>c.id==='expression');
 const companion=copy.find((c:any)=>c.id==='companion');const selectedOrder=data.sources?.project?.settings?.final_selection_v1?.entries??[];if(expression&&selectedOrder.length){const position=new Map(selectedOrder.map((e:any,i:number)=>[e.cardId,i]));expression.blocks.sort((a:any,b:any)=>(Number(position.get(a.cardId)??999999)-Number(position.get(b.cardId)??999999)));}
 const readerFields=['meaning','shadow_meaning','symbolism','prompts','keywords','cautions','correspondences'];
 const setupFields=['research_notes','sources','cultural_context','artwork_brief'];const workingFields=['permissions','rights_status','production_notes'];
 const text=(card:any,fields:string[])=>fields.filter(k=>typeof card?.content?.[k]==='string'&&card.content[k].trim()).map(k=>'### '+k.replaceAll('_',' ')+'\n\n'+card.content[k]).join('\n\n');
 const notes={id:'card-working-notes',blocks:[] as any[]},setupNotes={id:'card-setup-notes',blocks:[] as any[]};
 if(expression)for(const block of expression.blocks){
  const card=cards.find((c:any)=>c.id===block.cardId);
  const setupText=text(card,setupFields);if(setupText)setupNotes.blocks.push({...block,image:undefined,cardId:undefined,number:undefined,text:setupText});const privateText=text(card,workingFields);if(privateText)notes.blocks.push({...block,image:undefined,cardId:undefined,number:undefined,text:privateText});
  const visual=data.sources.project.settings?.visual_design_v1?.cards?.[card.id];
  delete block.workingSvg;if(visual)block.workingSvg=workingCardSvg(data.sources.project.settings.visual_design_v1,card);
  delete block.qrSvg;if(visual?.url&&['guidebook','both'].includes(qrDestination(visual))){block.qrSvg=visualQrSvg(visual);block.qrLabel=visual.mediaLabel||'Linked content for '+card.title;}
  block.text=text(card,readerFields);
  block.recurringSections=outlineSlots(guidebookOutline(data.sources.project.settings),card.id);
 }
 const sections=[...(data.sources?.sections??[])].sort((a:any,b:any)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id));
 const coverKinds=['front-cover','inside-front','inside-back','back-cover','spine'];
 const covers:any[]=[];const front:any[]=[],body:any[]=[],back:any[]=[];
 const base='/studio/projects/'+data.projectId;
 for(const section of sections){const matter=bookMatter(section);if(!bookSurfaceApplicable(section,sections))continue;
  const block={label:section.title,text:bookMatterText(section,sections),image:matter.image||undefined,href:base+'/guidebook/'+section.id+'/',sectionId:section.id,surface:matter.surface};
  if(coverKinds.includes(matter.surface)){covers.push(block);continue;}
  const target=matter.placement==='front'?front:matter.placement==='back'?back:body;
  if(matter.surface==='card-entries'){if(block.text.trim())target.push(block);target.push(...(expression?.blocks??[]));}else target.push(block);
 }
 const hasCardPosition=sections.some((s:any)=>bookMatter(s).surface==='card-entries');
 if(!hasCardPosition)body.push(...(expression?.blocks??[]));
 // Creator's explicit card-position section controls the complete sequence.
 const ordered=[...covers.filter(b=>['front-cover','inside-front'].includes(b.surface)),...front,...body,...back,...covers.filter(b=>['inside-back','back-cover','spine'].includes(b.surface))];
 const frontCover=sections.find((s:any)=>bookMatter(s).surface==='front-cover');
 return {
  manuscript:[{id:'manuscript',blocks:ordered}],
  covers:[{id:'covers',blocks:covers}],
  frontCover:frontCover?{fields:resolvedBookFields(frontCover,sections),image:bookMatter(frontCover).image,text:frontCover.body_markdown}:null,
  concept:[...copy.filter((c:any)=>['spark','foundation','architecture','visual-world'].includes(c.id)),setupNotes],
  planning:[...copy.filter((c:any)=>['making','into-the-world'].includes(c.id)),notes]
 };
}
