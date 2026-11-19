import {validateLocalCardArtwork,type LocalCardArtwork} from './localCardArtwork';
export type Inspiration={id:string;text:string;image:LocalCardArtwork|null;createdAt:string;assignment:null|{cardId:string;sectionId:string|null;at:string}};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const date=(v:any)=>typeof v==='string'&&v.length<=40&&Number.isFinite(Date.parse(v));
export function creativeInbox(settings:any):{version:1;entries:Inspiration[]}{
 const value=settings?.creative_inbox_v1;if(value===undefined)return {version:1,entries:[]};
 if(!value||value.version!==1||!Array.isArray(value.entries)||value.entries.length>1000||Object.keys(value).some(k=>!['version','entries'].includes(k)))throw Error('Saved inspiration could not be verified. Nothing was changed.');
 const seen=new Set<string>();for(const e of value.entries){if(!e||!uuid.test(e.id)||seen.has(e.id)||typeof e.text!=='string'||e.text.length>20000||!date(e.createdAt)||(!e.text.trim()&&!e.image)||Object.keys(e).some(k=>!['id','text','image','createdAt','assignment'].includes(k)))throw Error('An inspiration record is invalid.');seen.add(e.id);if(e.image)validateLocalCardArtwork(e.image);if(e.assignment!==null){const a=e.assignment;if(!a||!uuid.test(a.cardId)||(a.sectionId!==null&&(typeof a.sectionId!=='string'||a.sectionId.length>100))||!date(a.at)||Object.keys(a).some(k=>!['cardId','sectionId','at'].includes(k)))throw Error('An inspiration assignment is invalid.');}}
 return structuredClone(value);
}
export function saveInspiration(settings:any,input:any,at:string){
 if(!uuid.test(input.requestId)||typeof input.text!=='string'||input.text.length>20000||(!input.text.trim()&&!input.image))throw Error('Add some writing or an image before saving.');
 const image=input.image?validateLocalCardArtwork(input.image):null,inbox=creativeInbox(settings),prior=inbox.entries.find(e=>e.id===input.requestId);
 if(prior){if(prior.text!==input.text||JSON.stringify(prior.image)!==JSON.stringify(image))throw Error('This save already contains different writing. Keep your draft and start a new capture.');return {settings,entry:prior};}
 if(inbox.entries.length>=1000)throw Error('This project has reached its saved inspiration limit. Nothing was removed.');
 const entry:Inspiration={id:input.requestId,text:input.text,image,createdAt:at,assignment:null};inbox.entries.push(entry);const next={...settings,creative_inbox_v1:inbox};if(JSON.stringify(next).length>6500000)throw Error('This project has reached its storage limit. Your draft is still here; nothing was removed.');return {settings:next,entry};
}
export function validateInspirationReferences(settings:any,cards:Set<string>){const inbox=creativeInbox(settings);for(const e of inbox.entries)if(e.assignment){if(!cards.has(e.assignment.cardId))throw Error('An inspiration points to a card outside this project.');if(e.assignment.sectionId!==null&&!settings.guidebook_outline_v1?.sections?.some((s:any)=>s.id===e.assignment!.sectionId))throw Error('An inspiration section is missing.');}return inbox;}
