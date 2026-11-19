import type {APIRoute} from 'astro';
import {studioAccountAccessResponse as studioAccessResponse} from '../../../lib/studio/access';
import {guidebookOutline} from '../../../lib/studio/guidebookOutline';
export const prerender=false;
export const GET:APIRoute=async({locals,url})=>{
 const denied=await studioAccessResponse(locals.user,locals.profile,locals.supabase);if(denied)return denied;const id=url.searchParams.get('project');if(!id||!/^[a-f0-9-]{36}$/i.test(id))return new Response('Choose a project.',{status:400});
 const {data:project,error}=await locals.supabase!.from('studio_projects').select('id,name,settings,updated_at').eq('id',id).eq('owner_id',locals.user!.id).is('deleted_at',null).neq('status','archived').maybeSingle();if(error||!project)return new Response('Project unavailable.',{status:404});
 const cards=await locals.supabase!.from('studio_cards').select('id,title').eq('project_id',id).is('deleted_at',null).order('sort_order');if(cards.error)return new Response('Cards unavailable.',{status:503});const outline=guidebookOutline(project.settings);
 return new Response(JSON.stringify({id:project.id,name:project.name,updatedAt:project.updated_at,cards:cards.data,ready:outline.setupConfirmed===true,sections:outline.sections.filter(s=>!s.archived)}),{headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
};
