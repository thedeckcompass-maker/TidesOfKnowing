export const ADMIN_VIEWS=['all','reported','mentions','scribed','hidden'] as const;
export type AdminView=typeof ADMIN_VIEWS[number];
export const adminView=(value:unknown):AdminView=>ADMIN_VIEWS.includes(value as AdminView)?value as AdminView:'all';
export function itemMatches(item:any,view:AdminView){
 if(view==='reported')return Number(item.open_report_count)>0;
 if(view==='mentions')return item.mentions_leilia===true;
 if(view==='scribed')return Number(item.scribe_count)>0;
 if(view==='hidden')return item.status==='hidden';
 return true;
}
export function attentionCount(post:any,view:AdminView){return [post,...(post.replies??[])].filter(item=>itemMatches(item,view)).length;}
/** The stored model has root comments and one nested level; retain orphan context defensively. */
export function threadGroups(replies:any[]){
 const ids=new Set(replies.map(r=>r.id));
 const roots=replies.filter(r=>!r.parent_reply_id||!ids.has(r.parent_reply_id));
 return roots.map(parent=>({parent,children:replies.filter(r=>r.parent_reply_id===parent.id)}));
}
