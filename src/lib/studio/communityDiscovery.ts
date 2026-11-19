import {CREATIVE_CHAPTERS} from './communityChapters';
import {communityContinuation} from './communityNavigation';
export const PUBLIC_FOUNDER_ID='7e3224e7-b303-4150-a45e-dd9a12efdb68'; // Accepted permanent identity register; never resolved from a nickname.
export const DISCOVERY_PAGE_SIZE=20;
export type DiscoveryQuery={q:string;section:string;author:string;scope:'all'|'mine'|'leilia';cursor:string;limit:number};
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export const validCommunityId=(v:unknown):v is string=>typeof v==='string'&&uuid.test(v);
export const discoveryKeys=['q','section','author','cursor','within'] as const;
export function discoveryQuery(url:URL,section?:string):DiscoveryQuery{
 const q=(url.searchParams.get('q')??'').trim(),author=(url.searchParams.get('author')??'').trim(),selected=section??url.searchParams.get('section')??'';
 const view=url.searchParams.get('view')??url.searchParams.get('browse');
 const cursor=url.searchParams.get('cursor')??'';
 if(q.length>200||author.length>40||/[^\p{L}\p{N}_-]/u.test(author)||cursor.length>2400||(selected&&!CREATIVE_CHAPTERS.some(c=>c.id===selected)))throw Error('Check the search, public username or Section.');
 return {q,section:selected,author,scope:view==='mine'||view==='leilia'?view:'all',cursor,limit:view==='directory'||(!view&&!section&&!q&&!author)?5:DISCOVERY_PAGE_SIZE};
}
export function discoveryUrl(path:string,url:URL,changes:Record<string,string|null>={}){
 const target=new URL(path,'https://studio.invalid');
 for(const key of ['view','browse',...discoveryKeys]){const value=url.searchParams.get(key);if(value)target.searchParams.set(key,value);}
 for(const [key,value]of Object.entries(changes))value===null?target.searchParams.delete(key):target.searchParams.set(key,value);
 return communityContinuation(target.pathname+target.search,url.searchParams.get('from'));
}
export function discoveryState(url:URL){
 const state=new URL(url);const match=state.pathname.match(/^\/studio\/community\/([^/]+)\/$/);
 if(match&&CREATIVE_CHAPTERS.some(c=>c.id===match[1])){state.searchParams.set('within',match[1]);state.searchParams.set('section',match[1]);}
 const view=state.searchParams.get('view')??state.searchParams.get('browse')??(match?'all':'directory');state.searchParams.set('browse',view);state.searchParams.delete('view');return state;
}
export function discoveryReturn(url:URL){const within=url.searchParams.get('within'),valid=CREATIVE_CHAPTERS.some(c=>c.id===within);return discoveryUrl(valid?'/studio/community/'+within+'/':'/studio/community/',url,{view:url.searchParams.get('browse')??url.searchParams.get('view')??'all',browse:null});}
export function discoveryThreadUrl(chapter:string,id:string,url:URL,reply?:string){const result=discoveryUrl(`/studio/community/${chapter}/discussion/${id}/`,discoveryState(url),{view:null,...(validCommunityId(reply)?{reply}:{} )});return result+(validCommunityId(reply)?'#reply-'+reply:'');}
export function decodeDiscoveryCursor(raw:string){if(!raw)return null;try{if(raw.length>2400)throw Error();const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));if(!value||value.v!==1||!validCommunityId(value.id)||!Number.isFinite(Date.parse(value.created))||!Number.isFinite(Date.parse(value.snapshot)))throw Error();return value;}catch{throw Error('Search continuation is invalid. Start the search again.');}}
export function encodeDiscoveryCursor(value:unknown){return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
/** Strict projection: never copy arbitrary RPC objects or private member fields into HTML/JSON. */
export function discoveryResult(data:any,query:DiscoveryQuery){
 if(data?.version!==1||!Array.isArray(data.posts)||data.posts.length>query.limit||!Number.isSafeInteger(data.total)||data.total<0||!Number.isFinite(Date.parse(data.snapshot)))throw Error('Community search response is unavailable.');
 const seen=new Set<string>();const posts=data.posts.map((p:any)=>{
  if(!validCommunityId(p.id)||seen.has(p.id)||p.capability!=='general_community'||!['published','locked'].includes(p.status)||!CREATIVE_CHAPTERS.some(c=>c.id===p.chapter)||(query.section&&p.chapter!==query.section)||typeof p.question!=='string'||p.question.length>12000||typeof p.title!=='string'||p.title.length>200||typeof p.author_username!=='string'||p.author_username.length>40||!Number.isFinite(Date.parse(p.created_at))||!Number.isSafeInteger(p.reply_count)||p.reply_count<0||!Array.isArray(p.matches)||p.matches.length>3||(query.scope==='mine'&&p.my_conversation!==true)||(query.scope==='leilia'&&p.founder_contribution!==true))throw Error('Unexpected Community search audience or result.');seen.add(p.id);
  const matches=p.matches.map((r:any)=>{if(!validCommunityId(r.id)||typeof r.body!=='string'||r.body.length>400||typeof r.author_username!=='string'||r.author_username.length>40)throw Error('Unexpected reply search result.');return{id:r.id,body:r.body,author_username:r.author_username};});
  return{id:p.id,title:p.title,question:p.question,chapter:p.chapter,capability:p.capability,status:p.status,author_username:p.author_username,created_at:p.created_at,reply_count:p.reply_count,matches};
 });
 let next='';if(data.next){if(!validCommunityId(data.next.id)||!Number.isFinite(Date.parse(data.next.created)))throw Error('Invalid search continuation.');next=encodeDiscoveryCursor({v:1,id:data.next.id,created:data.next.created,snapshot:data.snapshot,q:query.q,section:query.section,author:query.author,scope:query.scope});}
 if(new TextEncoder().encode(JSON.stringify({posts,total:data.total,next})).length>1500000)throw Error('Community search response exceeds its safe limit.');
 return{posts,total:data.total,next,snapshot:data.snapshot};
}
export async function loadDiscovery(locals:any,query:DiscoveryQuery){
 if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile?.status!=='active')throw Error('Sign in with an active Studio account.');
 const provider=locals.studioSupportHostedEnabled===true&&locals.studioSupportLocal!==true?locals.studioSupportProvider:null;
 if(!provider||typeof provider.communitySearch!=='function')throw Error('Community search is not connected. No partial results are shown.');
 return provider.communitySearch(locals.user.id,query);
}
