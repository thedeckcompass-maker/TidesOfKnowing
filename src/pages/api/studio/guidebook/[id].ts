import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../lib/studio/access";
import { parseStudioGuidebookUpdate } from "../../../../lib/studio/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioAccessResponse(locals.user, locals.profile);
  if (accessResponse) return accessResponse;
  const sectionId = params.id;
  if (!sectionId || !locals.supabase) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const projectId = typeof form.get("project_id") === "string" ? String(form.get("project_id")) : "";
  if (!projectId) return new Response("Not found", { status: 404 });
  const parsed = parseStudioGuidebookUpdate(form);
  if (!parsed.ok) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/studio/projects/${projectId}/guidebook/${sectionId}/?error=${encodeURIComponent(parsed.error)}` },
    });
  }

  const { error } = await locals.supabase
    .from("studio_guidebook_sections")
    .update(parsed.value)
    .eq("id", sectionId)
    .eq("project_id", projectId);

  const location = error
    ? `/studio/projects/${projectId}/guidebook/${sectionId}/?error=${encodeURIComponent("The section could not be saved.")}`
    : `/studio/projects/${projectId}/guidebook/${sectionId}/?saved=1`;
  if (error) console.error("Unable to update guidebook section:", error);
  return new Response(null, { status: 303, headers: { Location: location } });
};
