import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";
import { parseStudioGuidebookCreate } from "../../../../../lib/studio/validation";

export const prerender = false;

function projectRedirect(projectId: string, key: "saved" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/?${key}=${encodeURIComponent(value)}#guidebook` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });

  const parsed = parseStudioGuidebookCreate(await request.formData());
  if (!parsed.ok) return projectRedirect(projectId, "error", parsed.error);

  const { data, error } = await locals.supabase
    .from("studio_guidebook_sections")
    .insert({ project_id: projectId, ...parsed.value })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Unable to create guidebook section:", error);
    const message = error?.code === "23505" ? "That guidebook order is already in use." : "The section could not be created.";
    return projectRedirect(projectId, "error", message);
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/guidebook/${data.id}/?created=1` },
  });
};
