import {sharedVisual} from './deckDesign';
import {preparedVisualImage,visualDefaults} from './visualDesign';
export type RelationshipCard={id:string;title:string;number:string;familyId:string|null;family:string;meaning:string;symbolism:string;correspondences:string;image:string;background:string;border:string;motifs:{label:string;why:string;cardIds:string[]}[]};
// A projection of saved records, never an interpretation or a second collection.
export function relationshipCards(project:any,cards:any[],families:any[]):RelationshipCard[]{
 const ids=new Set(cards.map(c=>c.id)),board=project.settings?.visual_design_v1,links=project.settings?.visual_direction_v1?.links??[];
 const colour=(v:unknown,fallback:string)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:fallback;
 return cards.map(c=>{const art=board?.cards?.[c.id],style=board?.deckConfigured?sharedVisual(board,c.id):{...visualDefaults,...board?.defaults,...art?.override};let image='';try{image=preparedVisualImage(art?.front??'')}catch{/* Old invalid preview is not executed or guessed. */}
 return {id:c.id,title:c.title,number:String(c.card_number??''),familyId:c.family_id??null,family:families.find(f=>f.id===c.family_id)?.name??'No family assigned',meaning:typeof c.content?.meaning==='string'?c.content.meaning:'',symbolism:typeof c.content?.symbolism==='string'?c.content.symbolism:'',correspondences:typeof c.content?.correspondences==='string'?c.content.correspondences:'',image,background:colour(style.background,visualDefaults.background),border:colour(style.borderColor,visualDefaults.borderColor),motifs:links.filter((l:any)=>Array.isArray(l.cardIds)&&l.cardIds.includes(c.id)).map((l:any)=>({label:String(l.motifs??''),why:String(l.why??''),cardIds:l.cardIds.filter((id:string)=>ids.has(id))}))};});
}
