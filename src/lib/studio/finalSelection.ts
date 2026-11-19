export type SelectionEntry={cardId:string;decision:'included'|'aside'|'pending'};
export type FinalSelection={version:1;revision:number;entries:SelectionEntry[];history:unknown[]};
export function finalSelection(settings:any,cards:{id:string}[],deletedCardIds:string[]=[]):FinalSelection{
 const saved=settings?.final_selection_v1;
 if(saved&&(saved.version!==1||!Array.isArray(saved.entries)||!Array.isArray(saved.history)))throw Error('This selection format needs review. Nothing was replaced.');
 const state:FinalSelection=saved?structuredClone(saved):{version:1,revision:0,entries:[],history:[]};
 const ids=new Set(cards.map(c=>c.id)),deleted=new Set(deletedCardIds);if(state.entries.some(e=>!ids.has(e.cardId)&&!deleted.has(e.cardId))||new Set(state.entries.map(e=>e.cardId)).size!==state.entries.length)throw Error('The saved selection refers to unavailable or duplicate cards. Review it before exporting.');
 state.entries=state.entries.filter(e=>ids.has(e.cardId));
 for(const card of cards)if(!state.entries.some(e=>e.cardId===card.id))state.entries.push({cardId:card.id,decision:'pending'});
 return state;
}
export function prepareFinalSelection(settings:any,input:any,cards:{id:string}[],at:string,deletedCardIds:string[]=[]){
 const prior=finalSelection(settings,cards,deletedCardIds),ids=new Set(cards.map(c=>c.id));
 if(input.expectedRevision!==prior.revision)throw Error('The final selection changed. Keep this draft and reopen before saving.');
 if(!Array.isArray(input.entries)||input.entries.length!==ids.size||new Set(input.entries.map((e:any)=>e.cardId)).size!==ids.size||input.entries.some((e:any)=>!ids.has(e.cardId)||!['included','aside','pending'].includes(e.decision)))throw Error('Decide about every current card; new cards must not be silently excluded.');
 const entries=input.entries.map((e:any)=>({cardId:e.cardId,decision:e.decision}));
 if(settings.final_selection_v1&&JSON.stringify(entries)===JSON.stringify(prior.entries))return settings;
 const deleted=new Set(deletedCardIds),retained=(settings.final_selection_v1?.entries??[]).filter((e:SelectionEntry)=>deleted.has(e.cardId));
 const result={...settings,final_selection_v1:{version:1,revision:prior.revision+1,entries:[...entries,...retained],history:[...prior.history,{at,revision:prior.revision,entries:settings.final_selection_v1?.entries??prior.entries}]}};
 if(JSON.stringify(result).length>6500000)throw Error('Selection history needs a backup before saving. Nothing was removed.');return result;
}
export function selectedCards(settings:any,cards:any[],deletedCardIds:string[]=[]){const state=finalSelection(settings,cards,deletedCardIds);if(!settings?.final_selection_v1||state.entries.some(e=>e.decision==='pending'))throw Error('Final selection is unresolved. Include or set aside every card, including late additions, before final export.');const selected=state.entries.filter(e=>e.decision==='included').map(e=>cards.find(c=>c.id===e.cardId));if(!selected.length)throw Error('Include at least one card before final export.');return selected;}
