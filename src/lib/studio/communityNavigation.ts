import {mapContext,ownedMapContext,type MapContext} from './orientation';
export const isCommunityPath=(path:string)=>/^\/studio\/(?:community(?:\/|$)|private-community\/$)/.test(path);
/** Strip private text and arbitrary parameters. Target routes still enforce permissions. */
export function communityWorkContext(raw:string|null):MapContext|null{
 if(!raw||!raw.startsWith('/studio/projects/'))return null;
 const context=mapContext(raw);if(!context.projectId)return null;
 const hash=new URL(raw,'https://studio.invalid').hash;
 const original=new URL(raw,'https://studio.invalid');
 if(context.path.includes('/journey/')&&['making','into-the-world'].includes(context.chapter??'')&&original.searchParams.get('moment')==='5'){const u=new URL(context.returnTo,'https://studio.invalid');u.searchParams.set('moment','5');context.path=u.pathname+u.search+u.hash;context.returnTo=context.path;}
 if(context.path.includes('/project-book/')&&/^#book-(?:concept|manuscript|planning)-[a-f0-9-]{1,1500}$/.test(hash)){context.path=context.path.replace(/#.*$/,'')+hash;context.returnTo=context.path;}
 if(context.path.includes('/my-deck/'))context.label='My cards';
 if(context.path.includes('/guidebook-outline/'))context.label='Design your guidebook';
 return context;
}
export async function ownedCommunityContext(locals:any,raw:string|null){
 const context=communityWorkContext(raw);if(!context||!locals.user||!locals.supabase)return null;
 const owned=await ownedMapContext(locals,context);return owned.projectId?owned:null;
}
export function communityContinuation(path:string,raw:string|null){const context=communityWorkContext(raw);return context?path+(path.includes('?')?'&':'?')+'from='+encodeURIComponent(context.returnTo):path;}
