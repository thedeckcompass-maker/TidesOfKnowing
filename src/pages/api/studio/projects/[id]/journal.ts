import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../lib/studio/access";
import { parseStudioJournalEntry } from "../../../../../lib/studio/validation";

export const prerender = false;

function journalRedirect(projectId: string, message: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/journal/?error=${encodeURIComponent(message)}` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioAccessResponse(locals.user, locals.profile);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });

  const parsed = parseStudioJournalEntry(await request.formData());
  if (!parsed.ok) return journalRedirect(projectId, parsed.error);

  const { data, error } = await locals.supabase
    .from("studio_journal_entries")
    .insert({ project_id: projectId, ...parsed.value })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Unable to create Studio journal entry:", error);
    return journalRedirect(projectId, "The journal entry could not be created.");
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/journal/${data.id}/?created=1` },
  });
};
