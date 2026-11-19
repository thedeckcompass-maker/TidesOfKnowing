import type { APIRoute } from "astro";
import { studioProjectWriteAccessResponse, sameOriginMutation } from "../../../../../lib/studio/access";
import { parseStudioCardCreate } from "../../../../../lib/studio/validation";

export const prerender = false;

function projectRedirect(projectId: string, key: "saved" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/?${key}=${encodeURIComponent(value)}#cards` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response('Invalid request origin.', {status:403});
  const accessResponse = await studioProjectWriteAccessResponse(locals.user, locals.profile, locals.supabase, params.id);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase || !locals.user) return new Response("Not found", { status: 404 });

  const form=await request.formData();
  const json=request.headers.get('accept')?.includes('application/json');
  const fail=(message:string,status=400)=>json?Response.json({error:message},{status}):projectRedirect(projectId,'error',message);
  const success=(id:string)=>{const location=`/studio/projects/${projectId}/cards/${id}/?created=1`;return json?Response.json({location}):new Response(null,{status:303,headers:{Location:location}})};
  const owned=await locals.supabase.from('studio_projects').select('id').eq('id',projectId).eq('owner_id',locals.user!.id).is('deleted_at',null).neq('status','archived').maybeSingle();
  if(owned.error){const message='Project ownership could not be verified. No changes were made.';const headers={'Cache-Control':'private, no-store'};return json?Response.json({error:message},{status:503,headers}):new Response(message,{status:503,headers});}if(!owned.data)return fail('Project unavailable.',404);
  const creationId=String(form.get('creation_id')??'');
  if(creationId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creationId))return fail('The creation reference is invalid. Keep your entries and reopen Add a card.');
  const reconcile=async()=>creationId?await locals.supabase!.from('studio_cards').select('id,title,card_number,family_id').eq('id',creationId).eq('project_id',projectId).is('deleted_at',null).maybeSingle():{data:null,error:null};
  const prior=await reconcile();if(prior.error)return fail('The previous creation could not be checked. Retry with your entries retained.',503);if(prior.data){if(prior.data.title!==String(form.get('title')??'').trim()||(prior.data.card_number??'')!==String(form.get('card_number')??'').trim()||(prior.data.family_id??'')!==String(form.get('family_id')??''))return fail('This card was already created before these entries changed. Your newer entries are retained here; open the saved card from My cards before applying them.',409);return success(prior.data.id);}
  const existing=await locals.supabase.from('studio_cards').select('sort_order').eq('project_id',projectId).is('deleted_at',null);
  if(existing.error)return fail('The collection could not be checked. Your card has not been created.',503);
  const used=new Set((existing.data??[]).map((c:any)=>c.sort_order));let position=0;while(used.has(position)&&position<=999)position++;
  if(position>999)return fail('The working collection has reached its supported capacity. No cards were removed.');
  form.set('sort_order',String(position));
  const parsed = parseStudioCardCreate(form);
  if (!parsed.ok) return fail(parsed.error);
  if(parsed.value.family_id){const family=await locals.supabase.from('studio_card_families').select('id').eq('id',parsed.value.family_id).eq('project_id',projectId).maybeSingle();if(family.error||!family.data)return fail('Choose a family from this project.');}

  const { data, error } = await locals.supabase
    .from("studio_cards")
    .insert({ ...(creationId?{id:creationId}:{}), project_id: projectId, ...parsed.value })
    .select("id")
    .single();

  if (error || !data) {
    const after=await reconcile();if(after.data){if(after.data.title!==parsed.value.title||(after.data.card_number??'')!==parsed.value.card_number||(after.data.family_id??'')!==(parsed.value.family_id??''))return fail('This creation reference already contains different entries. Your draft is retained.',409);return success(after.data.id);}
    console.error("Unable to create Studio card:", error);
    const message = error?.message?.includes('STUDIO_EXPLORE_CARD_CAPACITY') ? 'Explore includes ten active cards. Delete a card to make room, or upgrade to Create. Your entries are retained.' : error?.code === "23505" ? "Another card was captured at the same time. Please retry; existing cards are unchanged." : "The card could not be created.";
    return fail(message,409);
  }

  return success(data.id);
};
