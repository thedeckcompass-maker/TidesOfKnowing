import {cardSizePresets,visualDefaults,parseVisualBoard,blankVisualCard,type VisualBoard,type VisualStyle} from './visualDesign';
export const physicalKeys=['width','height','unit','sizePreset'];
export const lockableKeys=['elements','border','borderColor','background','titleFont','titleSize','titleColor','titleX','titleY','numberFont','numberSize','numberColor','numberX','numberY','backMode','symmetry','fit','qrX','qrY','qrSize'];
export type DeckBoard=VisualBoard&{deckConfigured?:boolean;locked?:string[]};
export const tarotGuide={width:2.99,height:4.99,trim:{x:.12,y:.12,width:2.75,height:4.75},safe:{x:.24,y:.24,width:2.51,height:4.51},source:'https://www.makeplayingcards.com/dl/templates/playingcard/tarot-size.pdf'};
export function sharedVisual(board:DeckBoard,id:string):VisualStyle{
 const own=board.cards[id]?.override??{},out={...visualDefaults,...board.defaults,...own};
 if(board.deckConfigured){for(const key of [...physicalKeys,...(board.locked??[])])(out as any)[key]=(board.defaults as any)[key]??(visualDefaults as any)[key];}
 return out;
}
export function sizeChanged(a:Partial<VisualStyle>,b:Partial<VisualStyle>){return a.width!==b.width||a.height!==b.height||a.unit!==b.unit;}
export function makeVisualUpdate(input:any,prior:DeckBoard|undefined,ids:Set<string>):DeckBoard{
 if(input.scope==='deck'){
  const preset=cardSizePresets.find(p=>p.id===input.defaults?.sizePreset);if(!preset)throw Error('Choose a supported deck size.');
  if(!Array.isArray(input.locked)||input.locked.some((k:unknown)=>typeof k!=='string'||!lockableKeys.includes(k)))throw Error('Choose valid shared design components.');
  const defaults={...visualDefaults,...input.defaults,width:preset.width,height:preset.height,unit:'in',sizePreset:preset.id};
  const mixed=prior&&Object.values(prior.cards).some(c=>physicalKeys.some(k=>k in c.override));
  if(prior&&(sizeChanged(prior.defaults,defaults)||mixed)&&input.confirmResize!==true)throw Error('Review the artwork impact and confirm the deck-wide size change. Nothing was changed.');
  const cards=structuredClone(prior?.cards??{});
  for(const c of Object.values(cards)){for(const key of physicalKeys)delete (c.override as any)[key];if(!prior||JSON.stringify(prior.defaults)!==JSON.stringify(defaults)||mixed)c.proofConfirmed=false;}
  const parsed=parseVisualBoard({defaults,cards,references:input.references??prior?.references??[],commonBack:input.commonBack??prior?.commonBack??'',notes:input.notes??prior?.notes??''},ids,prior);
  return {...parsed,deckConfigured:true,locked:[...new Set(input.locked)] as string[]};
 }
 if(input.scope==='card'){
  if(!prior?.deckConfigured)throw Error('Set up the deck design first. Your existing artwork is unchanged.');
  if(!ids.has(input.cardId))throw Error('Card not found in this project.');
  const card=input.card??blankVisualCard(),old=prior.cards[input.cardId];
  if(physicalKeys.some(k=>k in (card.override??{})))throw Error('Physical size is shared by the whole deck. Change it in Deck design.');
  for(const key of prior.locked??[]){if(JSON.stringify(card.override?.[key])!==JSON.stringify((old?.override as any)?.[key]))throw Error('This component is locked in Deck design.');}
  const parsed=parseVisualBoard({...prior,cards:{...prior.cards,[input.cardId]:card}},ids,prior);
  return {...parsed,deckConfigured:true,locked:prior.locked??[]};
 }
 throw Error('Choose a deck or card save.');
}
