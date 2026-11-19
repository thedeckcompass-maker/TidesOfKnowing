import type {Outline} from './guidebookOutline';
export const cardEntryPresets = {
 tarot: {label:'Tarot guidebook', sections:['Personal keywords','Core meaning','Imagery and symbolism','Upright interpretation','Reversed interpretation','Questions for reflection']},
 affirmation: {label:'Default affirmation', sections:['Affirmation','Supporting meaning','Context for reflection','Everyday application','Reflective question']},
 oracle: {label:'Oracle guidebook', sections:['Affirmation','Supporting meaning','Context for reflection','Everyday application','Reflective question']},
};
export type CardEntryPreset = keyof typeof cardEntryPresets;
export function missingPresetSections(outline:Outline,preset:CardEntryPreset){
 const active=new Set(outline.sections.filter(s=>!s.archived).map(s=>s.label.trim().toLocaleLowerCase()));
 return cardEntryPresets[preset].sections.filter(label=>!active.has(label.toLocaleLowerCase()));
}
// Additive only: no renaming, reordering, archiving or replacement of existing identities.
export function addPresetSections(outline:Outline,preset:CardEntryPreset,newId:()=>string){
 const next=structuredClone(outline);
 next.sections.push(...missingPresetSections(outline,preset).map(label=>({id:newId(),label,archived:false})));
 return next;
}
