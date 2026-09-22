import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../lib/studio/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioAccessResponse(locals.user, locals.profile);
  if (accessResponse) return accessResponse;
  const sectionId = params.id;
  if (!sectionId || !locals.supabase) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = typeof form.get("project_id") === "string" ? String(form.get("project_id")) : "";
  const versionId = typeof form.get("version_id") === "string" ? String(form.get("version_id")) : "";
  if (!projectId || !versionId) return new Response("Not found", { status: 404 });

  const { data: version, error: versionError } = await locals.supabase
    .from("studio_guidebook_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("section_id", sectionId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (versionError || !version?.snapshot) return new Response("Not found", { status: 404 });

  const snapshot = version.snapshot as Record<string, unknown>;
  const { error } = await locals.supabase
    .from("studio_guidebook_sections")
    .update({
      title: snapshot.title,
      section_type: snapshot.section_type,
      sort_order: snapshot.sort_order,
      status: snapshot.status,
      body_markdown: snapshot.body_markdown,
      card_id: snapshot.card_id,
      metadata: snapshot.metadata,
    })
    .eq("id", sectionId)
    .eq("project_id", projectId);
  if (error) console.error("Unable to restore guidebook version:", error);
  const suffix = error ? `error=${encodeURIComponent("The version could not be restored.")}` : "restored=1";
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/guidebook/${sectionId}/?${suffix}` },
  });
};
