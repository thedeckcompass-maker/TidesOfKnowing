import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../lib/studio/access";
import { parseStudioProjectCreate } from "../../../lib/studio/validation";

export const prerender = false;

function dashboardError(message: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/?error=${encodeURIComponent(message)}` },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const accessResponse = studioAccessResponse(locals.user, locals.profile);
  if (accessResponse) return accessResponse;
  if (!locals.supabase || !locals.user) return dashboardError("The Studio database is not available.");

  const parsed = parseStudioProjectCreate(await request.formData());
  if (!parsed.ok) return dashboardError(parsed.error);

  const { data, error } = await locals.supabase
    .from("studio_projects")
    .insert({ owner_id: locals.user.id, ...parsed.value })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Unable to create Studio project:", error);
    return dashboardError("The project could not be created. Please try again.");
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${data.id}/?created=1` },
  });
};
