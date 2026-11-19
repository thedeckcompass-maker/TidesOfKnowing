import {CREATIVE_CHAPTERS} from './creatorJourney';
export const ORIENTATION_VERSION=1;
export const ORIENTATION_SECTIONS=['Welcome','Plan your deck','Find a Section','What each Section covers','Project tools and support','Choose what to work on'];
const notes=[
  [
    "",
    "Explore the idea, purpose and perspective behind your deck. Record what draws you to it, what you hope it will offer and the creative principles you want to preserve. Bring selected reflections into an editable Creative North Star, while keeping your original words and saved versions available as the project evolves."
  ],
  [
    "",
    "Define who may use your deck, the experience you want to offer and the language and boundaries that support it. Consider its purpose, use settings, creative principles and responsibilities. Bring your reflections into an editable Creative Brief, then refine that brief without replacing the original responses."
  ],
  [
    "",
    "Explore the structure that serves your deck’s purpose. Describe its form, organizing ideas and intended use; review the existing card collection, families and relationships. Record connections and open questions, then bring your reflections into an editable Deck Blueprint as the collection develops."
  ],
  [
    "",
    "Develop the writing and imagery of individual cards. Open a card, work with the deck’s shared guidebook sections and keep supporting notes where useful. Write in any order, save unfinished entries and return to the collection to consider how each card contributes to the whole."
  ],
  [
    "",
    "Develop a visual language for your deck through imagery, symbols, color, typography and layout. Record visual direction, work with uploaded artwork and set shared card dimensions, borders, numbering and backs. Keep references and permissions with your working material, and choose deliberately what to share with an artist."
  ],
  [
    "",
    "Develop the guidebook that helps people use and understand your deck. Write introductions and instructions, and adapt explicitly selected card material into editable entries. Consider what a deck user needs to know and how much interpretive freedom to leave. Review the manuscript in order while keeping adaptations and their recorded sources distinct."
  ],
  [
    "",
    "Plan how your deck and companion publication will be produced. Record format, materials, packaging, quantities, supplier questions and cost assumptions, using the deck’s existing dimensions. Keep reference packages of selected versions and record proof decisions and remaining conditions as you prepare an edition."
  ],
  [
    "",
    "Plan how your deck will reach the people you want to serve. Define success, develop a deck story from your own writing or deliberately selected excerpts, and consider publishing routes that fit your goals. Record release, delivery and follow-up plans at an appropriate scale. These plans remain private until you choose how to share them."
  ]
];
export const ORIENTATION_CHAPTERS=CREATIVE_CHAPTERS.map((c,i)=>({...c,number:i+1,why:notes[i][0],how:notes[i][1],colour:['#f6efe0','#edf0e7','#e5eded','#eee8f1','#f3e7e0','#e9eff1','#eaf0e6','#f6efdf'][i]}));
export const WELCOME_OPENING='Use the Studio to develop a deck from your existing ideas, writing and images. You can start by adding cards or use the Sections to plan the deck, develop its writing and design, and prepare for production.';
export const WELCOME_DRAFT='I want this to be a place where you can recognize what is distinctive about your work and give it the attention it deserves. Your deck may grow from your experience as a reader, artist, writer or practitioner. It may be something deeply personal that you want to explore. Whatever its starting point, the perspective you bring matters. I have arranged this journey to help you keep that perspective present as the work becomes more detailed. We begin with why the deck matters, then gradually consider its structure, its individual cards, its visual world and the experience of the person who will use it. You can move between those parts as your understanding develops. An image may change what you want to say. Writing a card may reveal a relationship you had not noticed. Returning to an earlier Section is part of making the work coherent. My hope is that the Studio helps you stay connected to your own work while giving you a practical way to bring it into being.';
export const WHY_BEGIN='A deck brings together many decisions. How many cards will it contain? What will they look like? How will someone use them? What needs to be written, illustrated and printed? Those questions become easier to consider when you know what the work is trying to express. We begin by exploring your intention, your voice and what you hope the deck will offer. That gives you something to return to when an attractive idea pulls the project in a new direction, when a card feels out of place, or when a practical decision affects the creative work. You do not need a polished explanation before you begin. A fragment, an existing passage, a question or an image can be enough.';
export const MAP_INTRO='The map shows the eight Sections and the work each one contains. Select a Section to open it, or use the links to your cards, journal and saved Project Workbook. You can return to the map from the top menu at any time.';
export const MAP_TOOLS=[{id:'workshop',name:'My Workshop',text:'Add cards, write their text and work on artwork.'},{id:'journal',name:'Private journal',text:'Keep observations and images; choose launch excerpts explicitly.'},{id:'book',name:'My Project Workbook',text:'Review saved Section work and open its editor.'},{id:'guidance',name:'Guidance & conversation',text:'Help, community and confidential editorial remain distinct; access varies.'},{id:'artists',name:'Artists & visual direction',text:'A branch from Visual World; selected sharing only when available.'}];
export function localOrientation(locals:any){return locals.studioOrientationLocal===true?locals.studioOrientationStore:undefined;}
export function orientationActor(locals:any){return !!locals.user&&locals.profile?.id===locals.user.id&&locals.profile?.status==='active';}
export type MapContext={path:string;projectId:string|null;resourceId?:string;kind?:string;node:string;label:string;chapter?:string;returnTo:string};
export function mapContext(raw:string|null,chapter?:string|null,tool?:string|null):MapContext{
 const fallback:MapContext={path:'/studio/',projectId:null,node:'overview',label:'Studio overview',returnTo:'/studio/'};
 if(!raw||raw.length>1800||!raw.startsWith('/')||raw.startsWith('//')||/[\\\r\n]/.test(raw))return fallback;
 let u:URL;try{u=new URL(raw,'https://studio.invalid');if(u.origin!=='https://studio.invalid'||decodeURIComponent(u.pathname).includes('\\'))return fallback;}catch{return fallback;}
 const path=u.pathname.endsWith('/')?u.pathname:u.pathname+'/',m=path.match(/^\/studio\/projects\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(.*)$/i);
 const c=ORIENTATION_CHAPTERS.find(c=>c.id===(chapter??u.searchParams.get('chapter')));let node='overview',label='Studio overview',resourceId:string|undefined,kind:string|undefined;
 if(m){const tail=m[2];if(!tail){node='workshop';label='Workshop';}else if(tail==='project-book/'){node='book';label='My Project Workbook';}else if(tail==='guidebook-outline/'){node='spark';label='Card-entry setup';}else if(tail==='exports/'){node='book';label='Exports';}else if(tail==='production/'){node='making';label='Production plan';}else if(tail==='cards/new/'){node='expression';label='Add a card';}else if(tail==='my-deck/'){node='overview';label='My deck';}else if(tail==='journey/'){node=c?.id??'spark';label=c?.name??'The Spark';if(u.hash==='#project-book'||tool==='book'){node='book';label='My Project Workbook';}else if(tool==='guidance'||u.hash==='#chapter-support'){node='guidance';label='Support options'+(c?' — '+c.name:'');}}else if(/^cards\/[a-f0-9-]{36}\/$/i.test(tail)){node='expression';label='Card writing';kind='card';resourceId=tail.split('/')[1];}else if(/^(?:companion|guidebook)\/[a-f0-9-]{36}\/$/i.test(tail)){node='companion';label='Companion entry';kind='section';resourceId=tail.split('/')[1];}else if(tail==='journal/'||/^journal\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/$/i.test(tail)){node='journal';label=u.hash.includes('photograph')?'Journal photographs':'Private journal';if(tail!=='journal/'){kind='journal';resourceId=tail.split('/')[1];}}else if(tail==='visual-exchange/'){node='artists';label='Visual Design Exchange';}else if(tail==='crowd-funding/'||tail==='publishing/'){node='into-the-world';label=tail==='crowd-funding/'?'Crowd Funding':'Publishing resources';}else if(tail==='editorial/'){node='guidance';label='Confidential editorial feedback';}else return fallback;
 }else if(path==='/studio/creators-desk/'){label='Creator’s Desk';}else if(path==='/studio/welcome/'){label='Welcome to the Studio';}else if(path==='/studio/'||path==='/studio/account/'){label=path.includes('account')?'Account':'Studio overview';}else if(['/studio/artists/','/artists/collaborate/','/artists/visual-design-exchange/'].includes(path)){node='artists';label=path==='/studio/artists/'?'Artist directory':path.includes('collaborate')?'Artist profile':'Visual Design Exchange';}else return fallback;
 const params=new URLSearchParams();if(m&&m[2]==='journey/'&&c){params.set('chapter',c.id);const n=u.searchParams.get('moment');if(n&&/^\d+$/.test(n)&&Number(n)<=(['foundation','architecture'].includes(c.id)?5:4))params.set('moment',n);}
 if(m){for(const [key,values] of Object.entries({book:['concept','manuscript','planning'],task:['writing','artwork'],view:['project']})){const value=u.searchParams.get(key);if(value&&values.includes(value))params.set(key,value);}}
 const page=u.searchParams.get('page');if(m&&m[2]==='project-book/'&&page&&/^[1-9][0-9]{0,4}$/.test(page))params.set('page',page);
 const hash=['#project-book','#chapter-support','#journal-photographs','#photographs','#cards','#guidebook','#journal'].includes(u.hash)?u.hash:'';
 const clean=path+(params.size?'?'+params:'')+hash;return{path:clean,projectId:m?.[1]??null,resourceId,kind,node,label,chapter:c?.id,returnTo:clean};
}
export async function ownedMapContext(locals:any,context:MapContext){if(!context.projectId)return context;const {data:p}=await locals.supabase.from('studio_projects').select('id,name').eq('id',context.projectId).eq('owner_id',locals.user.id).maybeSingle();if(!p)return mapContext('/studio/');let label=context.label;if(context.resourceId){const table=context.kind==='card'?'studio_cards':context.kind==='section'?'studio_guidebook_sections':'studio_journal_entries';const {data:r}=await locals.supabase.from(table).select('title').eq('id',context.resourceId).eq('project_id',p.id).maybeSingle();if(!r)return mapContext('/studio/');label+=' — '+r.title;}else label+=' — '+p.name;return{...context,label};}
export function mapChapterHref(id:string,projectId:string|null){return projectId?'/studio/projects/'+projectId+'/journey/?chapter='+id:'/studio/welcome/#chapters';}
export function mapToolHref(id:string,context:MapContext){const base=context.projectId?'/studio/projects/'+context.projectId:null;return id==='artists'?'/artists/collaborate/':!base?'/studio/':id==='journal'?base+'/journal/':id==='book'?base+'/project-book/':id==='guidance'?base+'/journey/?chapter='+(context.chapter??'spark')+'#chapter-support':base+'/';}
