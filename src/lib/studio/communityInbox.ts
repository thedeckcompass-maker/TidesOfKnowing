import {CREATIVE_CHAPTERS} from './communityChapters';
export const INBOX_PATH='/ask-leilia/admin/studio-community/';
export const inboxId=(s:unknown):s is string=>typeof s==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s);
/** Reconstruct an internal return address from a small, bounded vocabulary. Never follow a supplied URL. */
export function inboxFilters(params:URLSearchParams){
 const out:Record<string,string>={};
 const choices:Record<string,string[]>={tab:['inbox','done','hidden','log'],type:['question','comment','report'],tier:['Explore','Create','Collaborate','Develop','Realise'],sort:['oldest','newest'],focus:['new','mentions','reports'],pillar:CREATIVE_CHAPTERS.map(c=>c.id)};
 for(const [key,values]of Object.entries(choices)){const v=params.get(key);if(v&&values.includes(v))out[key]=v;}
 if(/^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('month')??''))out.month=params.get('month')!;
 if(inboxId(params.get('handled')))out.handled=params.get('handled')!;
 if(params.get('q'))out.q=params.get('q')!.slice(0,150);
 if(/^[1-9]\d{0,4}$/.test(params.get('page')??''))out.page=params.get('page')!;
 return out;
}
export function inboxReturn(raw:string|null){const p=new URLSearchParams((raw??'').slice(0,2000));return INBOX_PATH+'?'+new URLSearchParams(inboxFilters(p));}
export function inboxMarker(url:URL){const id=url.searchParams.get('admin_task'),version=url.searchParams.get('task_version');return inboxId(id)&&/^[1-9]\d{0,12}$/.test(version??'')?{id,version:Number(version),returnTo:inboxReturn(url.searchParams.get('admin_return'))}:null;}
