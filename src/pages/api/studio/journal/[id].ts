import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../lib/studio/access";
import { parseStudioJournalEntry } from "../../../../lib/studio/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (accessResponse) return accessResponse;
  const entryId = params.id;
  if (!entryId || !locals.supabase) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const projectId = typeof form.get("project_id") === "string" ? String(form.get("project_id")) : "";
  if (!projectId) return new Response("Not found", { status: 404 });

  const parsed = parseStudioJournalEntry(form);
  if (!parsed.ok) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/studio/projects/${projectId}/journal/${entryId}/?error=${encodeURIComponent(parsed.error)}` },
    });
  }

  const { error } = await locals.supabase
    .from("studio_journal_entries")
    .update(parsed.value)
    .eq("id", entryId)
    .eq("project_id", projectId);

  if (error) console.error("Unable to update Studio journal entry:", error);
  const suffix = error ? `error=${encodeURIComponent("The journal entry could not be saved.")}` : "saved=1";
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/journal/${entryId}/?${suffix}` },
  });
};
