import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../lib/studio/access";
import { parseStudioProjectUpdate } from "../../../../lib/studio/validation";

export const prerender = false;

function projectRedirect(projectId: string, key: "saved" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/?${key}=${encodeURIComponent(value)}` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });

  const parsed = parseStudioProjectUpdate(await request.formData());
  if (!parsed.ok) return projectRedirect(projectId, "error", parsed.error);

  const { error } = await locals.supabase
    .from("studio_projects")
    .update(parsed.value)
    .eq("id", projectId);

  if (error) {
    console.error("Unable to update Studio project:", error);
    return projectRedirect(projectId, "error", "Project settings could not be saved.");
  }

  return projectRedirect(projectId, "saved", "settings");
};
