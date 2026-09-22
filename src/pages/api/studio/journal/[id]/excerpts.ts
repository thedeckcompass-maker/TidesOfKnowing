import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";
import { parseStudioJournalExcerpt } from "../../../../../lib/studio/validation";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const parsed = parseStudioJournalExcerpt(form);
  const base = `/studio/projects/${projectId}/journal/${params.id}/`;
  if (!parsed.ok) return new Response(null, { status: 303, headers: { Location: `${base}?error=${encodeURIComponent(parsed.error)}` } });
  const { error } = await locals.supabase.from("studio_journal_excerpts").insert({ project_id: projectId, journal_entry_id: params.id, ...parsed.value });
  return new Response(null, { status: 303, headers: { Location: error ? `${base}?error=${encodeURIComponent("The controlled excerpt could not be saved.")}` : `${base}?excerpt=1` } });
};
