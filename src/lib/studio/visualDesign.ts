export type VisualStyle = {
 elements:'artwork'|'studio';
 sizePreset?:string;
 width:number;height:number;unit:'mm'|'in';border:'none'|'full'|'bottom';borderColor:string;background:string;
 titleFont:string;titleSize:number;titleColor:string;titleX:number;titleY:number;
 numberFont:string;numberSize:number;numberColor:string;numberX:number;numberY:number;
 backMode:'common'|'individual';symmetry:boolean;fit:'contain'|'cover';artX:number;artY:number;artZoom:number;qrX:number;qrY:number;qrSize:number;
};
// Verified finished-cut inches from MPC's official template index; not its full catalog or bleed dimensions.
export const cardSizePresets=[
 {id:'tarot',name:'Tarot',width:2.75,height:4.75,pdf:'tarot-size.pdf'},
 {id:'jumbo',name:'Jumbo',width:3.5,height:5,pdf:'Jumbo-sizes.pdf'},
 {id:'large',name:'Large',width:3.5,height:5.75,pdf:'large-sizes.pdf'},
 {id:'poker-standard',name:'Poker — standard',width:2.48,height:3.46,pdf:'American-poker-size.pdf'},
 {id:'poker-traditional',name:'Poker — traditional',width:2.5,height:3.5,pdf:'poker-size.pdf'},
 {id:'bridge',name:'Bridge',width:2.25,height:3.5,pdf:'bridge-size.pdf'},
 {id:'square-2-5',name:'Square — 2.5 inch',width:2.5,height:2.5,pdf:'2-5X2-5-square-size-card.pdf'},
 {id:'square-2-75',name:'Square — 2.75 inch',width:2.75,height:2.75,pdf:'2_75square.pdf'},
 {id:'square-3-5',name:'Square — 3.5 inch',width:3.5,height:3.5,pdf:'3_5SqaureSize.pdf'},
] as const;
export function matchingCardSize(s:Partial<VisualStyle>){const scale=s.unit==='mm'?1/25.4:1;return cardSizePresets.find(p=>Math.abs(Number(s.width)*scale-p.width)<1e-8&&Math.abs(Number(s.height)*scale-p.height)<1e-8);}
export const visualDefaults:VisualStyle={elements:'studio',width:2.75,height:4.75,unit:'in',border:'none',borderColor:'#203f48',background:'#faf7ee',titleFont:'Georgia',titleSize:6,titleColor:'#203f48',titleX:50,titleY:12,numberFont:'Georgia',numberSize:5,numberColor:'#203f48',numberX:50,numberY:91,backMode:'common',symmetry:false,fit:'contain',artX:50,artY:50,artZoom:100,qrX:75,qrY:70,qrSize:22};
export type VisualCard={override:Partial<VisualStyle>;front:string;back:string;url:string;qrPlacement?:'card'|'guidebook'|'both'|'neither';mediaLabel:string;destinationConfirmed:boolean;rightsConfirmed:boolean;proofConfirmed:boolean;states:Record<string,string>};
export type VisualBoard={defaults:VisualStyle;cards:Record<string,VisualCard>;references:{id:string;image:string;note:string;rights:string}[];commonBack:string;notes:string};
const fonts=['Georgia','Arial','Verdana','Times New Roman'];
export function directMediaUrl(value:unknown):string {
 const s=String(value??'').trim();if(!s)return '';if(s.length>1200)throw new Error('Use a destination URL under 1,200 characters.');
 let u:URL;try{u=new URL(s)}catch{throw new Error('Enter a complete https:// destination URL.');}
 if(u.protocol!=='https:'||u.username||u.password)throw new Error('Use an HTTPS destination without embedded credentials.');
 return u.href;
}
export function preparedVisualImage(value:unknown):string{const s=String(value??'');if(s&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s))throw new Error('Use an image prepared by the upload control.');if(s.length>400000)throw new Error('That image is too large for this visual draft. Choose a smaller reference.');if(s){const raw=atob(s.split(',')[1]);if(raw.charCodeAt(0)!==255||raw.charCodeAt(1)!==216||raw.charCodeAt(raw.length-2)!==255||raw.charCodeAt(raw.length-1)!==217||/Exif\x00\x00|GPSLatitude|GPSLongitude|<x:xmpmeta/i.test(raw.slice(0,262144)))throw new Error('Prepare the image again as a metadata-free JPEG preview.');}return s;}
const image=preparedVisualImage;
export function validatedVisualStyle(value:any,partial=false):Partial<VisualStyle>{
 const out:any={};const input=value&&typeof value==='object'?value:{};
 for(const [key,defaultValue] of Object.entries(visualDefaults)){
  if(partial&&!(key in input))continue;const v=input[key]??defaultValue;
  if(typeof defaultValue==='number'){const n=Number(v);const max=key==='width'||key==='height'?1000:key==='artZoom'?200:100; if(!Number.isFinite(n)||n<(key==='artZoom'?100:0)||n>max||((key==='width'||key==='height')&&n<=0))throw new Error('Check card dimensions and placement values.');out[key]=n;}
  else if(typeof defaultValue==='boolean')out[key]=v===true;
  else if(key.endsWith('Color')||key==='background'){if(!/^#[0-9a-f]{6}$/i.test(v))throw new Error('Choose a valid colour.');out[key]=v;}
  else if(key.endsWith('Font')){if(!fonts.includes(v))throw new Error('Choose a supported font.');out[key]=v;}
  else{const options:any={elements:['artwork','studio'],unit:['mm','in'],border:['none','full','bottom'],backMode:['common','individual'],fit:['contain','cover']};if(!options[key]?.includes(v))throw new Error('Choose a valid visual preference.');out[key]=v;}
 }
 if(!partial||['width','height','unit','sizePreset'].some(k=>k in input)){
  const preset=input.sizePreset?cardSizePresets.find(p=>p.id===input.sizePreset):matchingCardSize(out);
  if(input.sizePreset&&input.sizePreset!=='legacy'&&!preset)throw new Error('Choose one of the supported MPC card sizes.');
  if(preset){out.sizePreset=preset.id;if(input.sizePreset&&input.sizePreset!=='legacy'){out.width=preset.width;out.height=preset.height;out.unit='in';}}else out.sizePreset='legacy';
 }
 return out;
}
function boundedText(value:unknown,max:number,label:string):string{const text=String(value??'');if(text.length>max)throw new Error(label+' is too long. Shorten it before saving; your draft remains here.');return text;}
export function parseVisualBoard(raw:any,cardIds:Set<string>,prior?:VisualBoard):VisualBoard{
 if(!raw||typeof raw!=='object')throw new Error('Visual draft is missing.');
 const cards:Record<string,VisualCard>={};for(const [id,v] of Object.entries(raw.cards??{}) as [string,any][]){
  if(!cardIds.has(id))throw new Error('A card does not belong to this project.');const url=directMediaUrl(v.url);
  const states:Record<string,string>={};for(const k of ['writing','front','back','guidebook','media']){const state=String(v.states?.[k]??'in_progress');if(!['not_applicable','in_progress','ready_for_review','approved'].includes(state))throw new Error('Choose a valid component state.');states[k]=state;}
  const qrPlacement=v.qrPlacement??'card';if(!['card','guidebook','both','neither'].includes(qrPlacement))throw Error('Choose a supported QR destination.');
  cards[id]={qrPlacement,override:validatedVisualStyle(v.override,true),front:image(v.front),back:image(v.back),url,mediaLabel:boundedText(v.mediaLabel,200,'Destination label'),destinationConfirmed:!!v.destinationConfirmed,rightsConfirmed:!!v.rightsConfirmed,proofConfirmed:!!v.proofConfirmed,states};
 }
 const refs=Array.isArray(raw.references)?raw.references:[];if(refs.length>12)throw new Error('Keep this draft board to twelve references; export existing choices before replacing them.');
 const result={defaults:validatedVisualStyle(raw.defaults) as VisualStyle,cards,references:refs.map((v:any)=>({id:boundedText(v.id,80,'Reference identifier'),image:image(v.image),note:boundedText(v.note,1000,'Reference note'),rights:boundedText(v.rights,1000,'Rights note')})),commonBack:image(raw.commonBack),notes:boundedText(raw.notes,10000,'Visual intention')};
 const sameSize=(a:VisualStyle,b:VisualStyle)=>a.width===b.width&&a.height===b.height&&a.unit===b.unit;
 if(!matchingCardSize(result.defaults)&&(!prior||!sameSize(result.defaults,prior.defaults)))throw new Error('Choose a supported MPC size. Your existing saved size has not been changed.');
 for(const id of Object.keys(cards)){const current=effectiveVisual(result,id);if(!matchingCardSize(current)&&(!prior||!sameSize(current,effectiveVisual(prior,id))))throw new Error('Choose a supported MPC size for this card. Your draft remains here.');}
 return result;
}
export function effectiveVisual(board:VisualBoard,id:string):VisualStyle{return {...visualDefaults,...board.defaults,...board.cards[id]?.override};}
export function blankVisualCard():VisualCard{return{qrPlacement:'guidebook',override:{},front:'',back:'',url:'',mediaLabel:'',destinationConfirmed:false,rightsConfirmed:false,proofConfirmed:false,states:{writing:'in_progress',front:'in_progress',back:'in_progress',guidebook:'in_progress',media:'not_applicable'}};}
export function mediaEvidence(card:VisualCard){return{recorded:!!card.url,generated:!!card.url,destination:!!card.url&&card.destinationConfirmed,rights:!!card.url&&card.rightsConfirmed,printProof:!!card.url&&card.proofConfirmed};}
