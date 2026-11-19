import type {APIRoute} from 'astro';
import {studioProjectReadAccessResponse} from '../../../../../lib/studio/access';
import {projectBookView} from '../../../../../lib/studio/projectBookView';
export const prerender=false;
async function rows(client:any,table:string,columns:string,id:string){const output:any[]=[];for(let start=0;;start+=500){let query=client.from(table).select(columns).eq('project_id',id);if(table==='studio_cards')query=query.is('deleted_at',null);const {data,error}=await query.order('sort_order').order('id').range(start,start+499);if(error)throw Error('Saved material could not be loaded.');output.push(...(data??[]));if((data??[]).length<500)return output;}}
export const GET:APIRoute=async({locals,params})=>{
 const denied=await studioProjectReadAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(denied)return denied;
 if(!locals.user||!locals.supabase||!params.id)return new Response(null,{status:404});
 const {data:project,error}=await locals.supabase.from('studio_projects').select('*').eq('id',params.id).eq('owner_id',locals.user.id).is('deleted_at',null).maybeSingle();
 if(error||!project)return new Response(null,{status:404});
 try{const [cards,sections]=await Promise.all([rows(locals.supabase,'studio_cards','id,title,card_number,content,sort_order,status',project.id),rows(locals.supabase,'studio_guidebook_sections','id,title,body_markdown,metadata,sort_order',project.id)]);const {data:production,error:productionError}=await locals.supabase.from('studio_production_plans').select('*').eq('project_id',project.id).maybeSingle();const {data:families,error:familyError}=await locals.supabase.from('studio_card_families').select('*').eq('project_id',project.id).order('sort_order');const {data:programme,error:programmeError}=await locals.supabase.from('studio_programme_progress').select('*').eq('project_id',project.id).order('week_number');if(productionError||familyError||programmeError)throw Error();return new Response(JSON.stringify(projectBookView(project,cards,sections,production,families??[],programme??[])),{headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});}catch{return new Response('Saved material could not be loaded.',{status:503,headers:{'Cache-Control':'private,no-store'}});}
};
