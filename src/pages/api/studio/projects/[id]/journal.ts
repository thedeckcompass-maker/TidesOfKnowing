import type { APIRoute } from "astro";
import { studioProjectWriteAccessResponse as studioWriteAccessResponse, sameOriginMutation } from "../../../../../lib/studio/access";
import { parseStudioJournalEntry } from "../../../../../lib/studio/validation";

export const prerender = false;

function journalRedirect(projectId: string, message: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/journal/?error=${encodeURIComponent(message)}` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const accessResponse = await studioWriteAccessResponse(locals.user,locals.profile,locals.supabase,params.id);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });

  const form=await request.formData(),jsonMode=request.headers.get('accept')==='application/json';
  const parsed = parseStudioJournalEntry(form);
  const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
  const captureId=String(form.get('capture_id')??'');
  if(captureId&&!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(captureId))return json({error:'Invalid capture identity.'},400);
  if(parsed.ok){const owned=await locals.supabase.from('studio_projects').select('id').eq('id',projectId).eq('owner_id',locals.user!.id).maybeSingle();if(!owned.data)return json({error:'Project not found.'},404);for(const [field,table]of [['linked_card_id','studio_cards'],['linked_section_id','studio_guidebook_sections']] as const){const id=parsed.value[field];if(id){let targetQuery=locals.supabase.from(table).select('id').eq('id',id).eq('project_id',projectId);if(table==='studio_cards')targetQuery=targetQuery.is('deleted_at',null);const target=await targetQuery.maybeSingle();if(!target.data)return json({error:'Choose a source in this project.'},400);}}if(captureId){const {data:prior}=await locals.supabase.from('studio_journal_entries').select('*').eq('id',captureId).eq('project_id',projectId).maybeSingle();if(prior){if(Object.entries(parsed.value).some(([k,v])=>JSON.stringify(prior[k])!==JSON.stringify(v)))return json({error:'This capture identity already saved different writing. Open the original before starting a new capture.'},409);return json({entry:prior,repeated:true});}}}

  if (!parsed.ok) return jsonMode?json({error:parsed.error},400):journalRedirect(projectId, parsed.error);

  const { data, error } = await locals.supabase
    .from("studio_journal_entries")
    .insert({ ...(captureId?{id:captureId}:{}),project_id: projectId, ...parsed.value })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Unable to create Studio journal entry:", error);
    if(jsonMode)return json({error:'The observation could not be saved. Your words remain on this page.'},503);
    return journalRedirect(projectId, "The journal entry could not be created.");
  }

  if(jsonMode)return json({entry:data});
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/journal/${data.id}/?created=1` },
  });
};
