import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../lib/studio/access";
import { parseStudioCardCreate } from "../../../../../lib/studio/validation";

export const prerender = false;

function projectRedirect(projectId: string, key: "saved" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/?${key}=${encodeURIComponent(value)}#cards` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioAccessResponse(locals.user, locals.profile);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });

  const parsed = parseStudioCardCreate(await request.formData());
  if (!parsed.ok) return projectRedirect(projectId, "error", parsed.error);

  const { data, error } = await locals.supabase
    .from("studio_cards")
    .insert({ project_id: projectId, ...parsed.value })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Unable to create Studio card:", error);
    const message = error?.code === "23505" ? "That card order is already in use." : "The card could not be created.";
    return projectRedirect(projectId, "error", message);
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/cards/${data.id}/?created=1` },
  });
};
