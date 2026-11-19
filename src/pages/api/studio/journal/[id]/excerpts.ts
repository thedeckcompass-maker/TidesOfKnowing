import type { APIRoute } from "astro";
import { studioAccountAccessResponse as studioWriteAccessResponse, studioProjectWriteAccessResponse, sameOriginMutation } from "../../../../../lib/studio/access";
import { parseStudioJournalExcerpt } from "../../../../../lib/studio/validation";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const access = await studioWriteAccessResponse(locals.user, locals.profile, locals.supabase);
  if (access) return access;
  if (!locals.supabase || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const projectAccess=await studioProjectWriteAccessResponse(locals.user,locals.profile,locals.supabase,projectId);
  if(projectAccess)return projectAccess;
  const parsed = parseStudioJournalExcerpt(form);
  const base = form.get('return_to')==='crowd-funding'?`/studio/projects/${projectId}/crowd-funding/?entry=${params.id}&`:`/studio/projects/${projectId}/journal/${params.id}/?`;
  const source=await locals.supabase.from('studio_journal_entries').select('id').eq('id',params.id).eq('project_id',projectId).maybeSingle();
  if(source.error||!source.data)return new Response('This journal entry is not available in this project.',{status:404});
  if (!parsed.ok) return new Response(null, { status: 303, headers: { Location: `${base}error=${encodeURIComponent(parsed.error)}` } });
  if(parsed.value.photo_id){const photo=await locals.supabase.from('studio_journal_photos').select('*').eq('id',parsed.value.photo_id).eq('project_id',projectId).eq('journal_entry_id',params.id).maybeSingle();if(photo.error||!photo.data||photo.data.retired_at)return new Response(null,{status:303,headers:{Location:base+'error='+encodeURIComponent('Choose a photograph belonging to the selected source entry.')}});}
  const { error } = await locals.supabase.from("studio_journal_excerpts").insert({ project_id: projectId, journal_entry_id: params.id, ...parsed.value });
  return new Response(null, { status: 303, headers: { Location: error ? `${base}error=${encodeURIComponent("The journey update could not be prepared.")}` : `${base}excerpt=1` } });
};
