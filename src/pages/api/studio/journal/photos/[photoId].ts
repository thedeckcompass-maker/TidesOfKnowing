import type { APIRoute } from "astro";
import { studioAccountAccessResponse as studioWriteAccessResponse, studioProjectWriteAccessResponse, sameOriginMutation } from "../../../../../lib/studio/access";


export const prerender = false;
export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const access = await studioWriteAccessResponse(locals.user, locals.profile, locals.supabase);
  if (access) return access;
  if (!locals.supabase || !params.photoId) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const projectAccess=await studioProjectWriteAccessResponse(locals.user,locals.profile,locals.supabase,projectId);
  if(projectAccess)return projectAccess;
  const entryId = String(form.get("entry_id") ?? "");
  const { data: photo } = await locals.supabase.from("studio_journal_photos").select("storage_path").eq("id", params.photoId).eq("project_id", projectId).eq("journal_entry_id", entryId).maybeSingle();
  if (!photo) return new Response("Not found", { status: 404 });
  const {error: deleteError}=await locals.supabase.from("studio_journal_photos").update({retired_at:new Date().toISOString()}).eq("id",params.photoId).eq("project_id",projectId).eq("journal_entry_id",entryId);
  if(deleteError)return new Response("Photograph retention is not available in this environment. Nothing was deleted.",{status:409});
  return new Response(null, { status: 303, headers: { Location: `/studio/projects/${projectId}/journal/${entryId}/?photoRemoved=1` } });
};
