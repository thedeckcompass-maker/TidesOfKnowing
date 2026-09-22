import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../lib/studio/access";
import { STUDIO_JOURNAL_PHOTO_BUCKET, STUDIO_JOURNAL_PHOTO_LIMIT, validateSanitisedJournalPhoto } from "../../../../../lib/studio/journalMedia";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioAccessResponse(locals.user, locals.profile);
  if (access) return access;
  if (!locals.supabase || !locals.user || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const caption = String(form.get("caption") ?? "").trim().slice(0, 240);
  const redirect = (message: string) => new Response(null, { status: 303, headers: { Location: `/studio/projects/${projectId}/journal/${params.id}/?error=${encodeURIComponent(message)}` } });
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return new Response("Not found", { status: 404 });

  const { data: entry } = await locals.supabase.from("studio_journal_entries").select("id").eq("id", params.id).eq("project_id", projectId).maybeSingle();
  if (!entry) return new Response("Not found", { status: 404 });
  const { data: existing, error: countError } = await locals.supabase.from("studio_journal_photos").select("sort_order").eq("journal_entry_id", params.id).order("sort_order");
  if (countError) return redirect("The journal photographs could not be checked.");
  const files = form.getAll("photos");
  if (!files.length) return redirect("Choose at least one photograph.");
  if ((existing?.length ?? 0) + files.length > STUDIO_JOURNAL_PHOTO_LIMIT) return redirect("Each journal entry can hold up to five photographs.");

  const usedOrders = new Set((existing ?? []).map((photo) => photo.sort_order));
  for (const value of files) {
    const checked = await validateSanitisedJournalPhoto(value);
    if (!checked.ok) return redirect(checked.error);
    const nextOrder = [0, 1, 2, 3, 4].find((order) => !usedOrders.has(order));
    if (nextOrder === undefined) return redirect("This journal entry has reached the five-photograph limit.");
    const storagePath = `${locals.user.id}/${projectId}/${params.id}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await locals.supabase.storage.from(STUDIO_JOURNAL_PHOTO_BUCKET).upload(storagePath, checked.file, { contentType: "image/jpeg", upsert: false });
    if (uploadError) return redirect("The prepared photograph could not be stored.");
    const { error: insertError } = await locals.supabase.from("studio_journal_photos").insert({ project_id: projectId, journal_entry_id: params.id, storage_path: storagePath, caption, sort_order: nextOrder });
    if (insertError) {
      await locals.supabase.storage.from(STUDIO_JOURNAL_PHOTO_BUCKET).remove([storagePath]);
      return redirect("The photograph record could not be saved.");
    }
    usedOrders.add(nextOrder);
  }
  return new Response(null, { status: 303, headers: { Location: `/studio/projects/${projectId}/journal/${params.id}/?photos=1` } });
};
