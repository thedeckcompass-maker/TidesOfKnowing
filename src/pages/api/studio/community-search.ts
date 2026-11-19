import type {APIRoute} from 'astro';
import {discoveryQuery,loadDiscovery} from '../../../lib/studio/communityDiscovery';
export const prerender=false;
export const GET:APIRoute=async({locals,url})=>{
 const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
 if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile?.status!=='active')return json({error:'Sign in with an active Studio account.'},401);
 let query;try{query=discoveryQuery(url);}catch{return json({error:'Check the search filters.'},400);}
 try{return json(await loadDiscovery(locals,query));}catch{return json({error:'Community search is unavailable. No partial results are shown.'},503);}
};
