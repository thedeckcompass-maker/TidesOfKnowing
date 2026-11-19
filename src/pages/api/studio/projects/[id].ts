import type { APIRoute } from "astro";
import { sameOriginMutation, studioProjectWriteAccessResponse as studioAccessResponse } from "../../../../lib/studio/access";
import { parseStudioProjectUpdate } from "../../../../lib/studio/validation";

export const prerender = false;

function projectRedirect(projectId: string, key: "saved" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/?view=project&${key}=${encodeURIComponent(value)}` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const accessResponse = await studioAccessResponse(locals.user, locals.profile, locals.supabase, params.id);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });

  if (!locals.user) return new Response("Not found", { status: 404 });

  const owned = await locals.supabase
    .from("studio_projects")
    .select("id,updated_at")
    .eq("id", projectId)
    .eq("owner_id", locals.user.id)
    .maybeSingle();

  if (owned.error) {
    console.error("Unable to verify Studio project ownership:", owned.error);
    return new Response(
      "Project ownership could not be verified. No changes were made.",
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  if (!owned.data) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const stamp = form.get("expected_updated_at");
  if (typeof stamp !== "string" || stamp !== owned.data.updated_at) return projectRedirect(projectId, "error", "This project changed in another editor. Keep your draft and review the latest settings before saving.");
  const parsed = parseStudioProjectUpdate(form);
  if (!parsed.ok) return projectRedirect(projectId, "error", parsed.error);

  const { data, error } = await locals.supabase.from("studio_projects").update(parsed.value).eq("id", projectId).eq("owner_id", locals.user.id).eq("updated_at", stamp).select("id");

  if (error || !data || data.length !== 1 || data[0].id !== projectId) {
    console.error("Unable to update Studio project:", error);
    return projectRedirect(projectId, "error", "Project settings could not be saved.");
  }

  return projectRedirect(projectId, "saved", "settings");
};
