import {CREATIVE_CHAPTERS} from './communityChapters';
import {discoveryUrl,discoveryState,discoveryReturn} from './communityDiscovery';
export function communityView(value:unknown){return value==='all'||value==='mine'||value==='leilia'?value:'directory';}
export function communityPage(path:string,url:URL){
 return discoveryUrl(path,discoveryState(url),{view:null});
}
export function communityBrowseReturn(url:URL){
 return discoveryReturn(url);
}
export function communityConversations(posts:any[],mine=false){
 return posts.filter(p=>p.capability==='general_community'&&CREATIVE_CHAPTERS.some(c=>c.id===p.chapter)&&(!mine||p.my_conversation===true||p.replies?.some((r:any)=>r.my_reply===true&&!r.deleted)))
 .sort((a,b)=>Math.max(Date.parse(b.created_at)||0,Date.parse(b.last_activity_at)||0)-Math.max(Date.parse(a.created_at)||0,Date.parse(a.last_activity_at)||0)||String(a.id).localeCompare(String(b.id)));
}
