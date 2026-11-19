export const CREATIVE_CHAPTERS=[
 {id:'spark',name:'The Spark',output:'Creative North Star',question:'What is your deck about, and why do you want to create it?'},
 {id:'foundation',name:'The Foundation',output:'Creative Brief',question:'Who is this for, and what experience should it offer?'},
 {id:'architecture',name:'The Architecture',output:'Deck Blueprint',question:'What structure best serves this idea?'},
 {id:'expression',name:'The Expression',output:'Living Deck Manuscript',question:'Write and design the individual cards in your deck.'},
 {id:'visual-world',name:'The Visual World',output:'Visual Design Book',question:'How will the deck communicate visually?'},
 {id:'companion',name:'The Companion',output:'Companion Manuscript',question:'How will someone learn to use and understand it?'},
 {id:'making',name:'The Making',output:'Production Book',question:'Plan the cards, guidebook, packaging and production.'},
 {id:'into-the-world',name:'Into the World',output:'Publication and Launch Book',question:'How will the deck reach the people it was made for?'},
] as const;
export const SPARK_RESPONSES=['startingPlace','background','backgroundNotes','heart','inspiration','why','experience','perspective','connection','expression','principles'] as const;
export const NORTH_STAR_FIELDS=['idea','why','contribution','experience','principles'] as const;
export type SparkResponses=Record<typeof SPARK_RESPONSES[number],string>;
export type NorthStar=Record<typeof NORTH_STAR_FIELDS[number],string>;
export type JourneyState={version:1;chapter:string;moment:number;guidance:'guided'|'independent'};
export type NorthStarDocument={version:1;revision:number;responses:SparkResponses;northStar:NorthStar;history:{savedAt:string;revision:number;responses:SparkResponses;northStar:NorthStar}[]};
export function blankSpark(){return Object.fromEntries(SPARK_RESPONSES.map(k=>[k,''])) as SparkResponses;}
export function blankNorthStar(){return Object.fromEntries(NORTH_STAR_FIELDS.map(k=>[k,''])) as NorthStar;}
export function journeyFromSettings(settings:Record<string,any>){return {journey:(settings.creator_journey_v1??{version:1,chapter:'spark',moment:0,guidance:'guided'}) as JourneyState,document:(settings.creative_north_star_v1??{version:1,revision:0,responses:blankSpark(),northStar:blankNorthStar(),history:[]}) as NorthStarDocument};}
function exactText(value:unknown,label:string){if(typeof value!=='string')throw Error(`Check ${label}.`);if(value.length>40000)throw Error(`${label} is too long to save in one field. Your draft has not been shortened.`);return value;}
export function prepareJourneyUpdate(input:any,settings:Record<string,any>,savedAt:string){
 const prior=journeyFromSettings(settings);if(prior.document.version!==1||prior.journey.version!==1)throw Error('This project uses a newer journey format. Nothing was replaced.');
 const j=input.journey;if(!j||!CREATIVE_CHAPTERS.some(c=>c.id===j.chapter)||!Number.isInteger(j.moment)||j.moment<0||j.moment>(['foundation','architecture'].includes(j.chapter)?5:4)||!['guided','independent'].includes(j.guidance))throw Error('Choose a valid chapter and guidance preference.');
 const responses=Object.fromEntries(SPARK_RESPONSES.map(k=>[k,exactText(input.responses?.[k],k)])) as SparkResponses;
 if(!['','idea','notes','underway','advanced'].includes(responses.startingPlace)||!['','personal','reader','creative','professional','combined'].includes(responses.background))throw Error('Choose a valid starting place.');
 const northStar=Object.fromEntries(NORTH_STAR_FIELDS.map(k=>[k,exactText(input.northStar?.[k],k)])) as NorthStar;
 const journey:JourneyState={version:1,chapter:j.chapter,moment:j.moment,guidance:j.guidance};
 const changed=JSON.stringify(responses)!==JSON.stringify(prior.document.responses)||JSON.stringify(northStar)!==JSON.stringify(prior.document.northStar);
 const document:NorthStarDocument=changed?{version:1,revision:prior.document.revision+1,responses,northStar,history:[...prior.document.history,...(prior.document.revision?[{savedAt,revision:prior.document.revision,responses:prior.document.responses,northStar:prior.document.northStar}]:[])]}:prior.document;
 const next={...settings,creator_journey_v1:journey,creative_north_star_v1:document};if(JSON.stringify(next).length>6500000)throw Error('This project’s reflection history needs a backup before more can be saved. No history was removed.');
 return {settings:next,changed:changed||JSON.stringify(journey)!==JSON.stringify(prior.journey),document,journey};
}
// This is explicit verbatim copying, not AI synthesis. The creator can edit every result.
export function northStarUsingOriginalWords(r:SparkResponses):NorthStar{return {idea:r.heart,why:r.why,contribution:[r.perspective,r.connection].filter(Boolean).join('\n\n'),experience:r.experience||r.expression,principles:r.principles};}

