import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";

export const prerender = false;

function programmeRedirect(projectId: string, key: "started" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/programme/?${key}=${encodeURIComponent(value)}` },
  });
}

export const POST: APIRoute = async ({ locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });

  const { error } = await locals.supabase.rpc("studio_start_programme", {
    target_project_id: projectId,
  });

  if (error) {
    console.error("Unable to start Studio programme:", error);
    return programmeRedirect(projectId, "error", "The programme could not be started.");
  }

  return programmeRedirect(projectId, "started", "1");
};
