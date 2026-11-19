/** Permanently parked public Commons. Shared accounts, DCS and moderation remain. */
export function parkedCommonsResponse():Response{return new Response('Practice Commons is no longer available. Deck Creator Studio remains available at /studio/.',{status:410,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});}
export function isParkedCommonsPath(pathname:string):boolean{
 let p:string;try{p=decodeURIComponent(pathname).replace(/\/+$/,'')||'/';}catch{return pathname.startsWith('/community')||pathname.startsWith('/api/community');}
 if(p==='/api/community/posts')return true;
 if(p!=='/community'&&!p.startsWith('/community/'))return false;
 if(p==='/community/account'||p==='/community/sections/deck-creator-studio')return false;
 // Existing DCS history uses /community/:slug; the page verifies its persisted room.
 if(/^\/community\/[^/]+(?:\/edit)?$/.test(p)&&!['/community/search','/community/page','/community/sections'].includes(p))return false;
 return true;
}
export function isDcsHistoryPost(post:{section?:{key?:string}|null}|null):boolean{return post?.section?.key==='deck-creator-studio';}
