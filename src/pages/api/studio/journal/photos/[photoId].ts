import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../lib/studio/access";
import { removeStudioJournalPhotoObject } from "../../../../../lib/studio/journalMedia";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioAccessResponse(locals.user, locals.profile);
  if (access) return access;
  if (!locals.supabase || !params.photoId) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const entryId = String(form.get("entry_id") ?? "");
  const { data: photo } = await locals.supabase.from("studio_journal_photos").select("storage_path").eq("id", params.photoId).eq("project_id", projectId).eq("journal_entry_id", entryId).maybeSingle();
  if (!photo) return new Response("Not found", { status: 404 });
  const { error: deleteError } = await locals.supabase.from("studio_journal_photos").delete().eq("id", params.photoId).eq("project_id", projectId);
  if (deleteError) return new Response(null, { status: 303, headers: { Location: `/studio/projects/${projectId}/journal/${entryId}/?error=${encodeURIComponent("The photograph record could not be removed.")}` } });
  const removed = await removeStudioJournalPhotoObject(locals.supabase, photo.storage_path);
  if (removed.error) console.error("Unable to remove orphaned Studio journal photo object:", removed.error);
  return new Response(null, { status: 303, headers: { Location: `/studio/projects/${projectId}/journal/${entryId}/?photoRemoved=1` } });
};
