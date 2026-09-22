import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../lib/studio/access";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioAccessResponse(locals.user, locals.profile);
  if (access) return access;
  if (!locals.supabase || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const { error } = await locals.supabase.from("studio_pulse_requests").update({ status: "withdrawn", consent_withdrawn_at: new Date().toISOString(), access_expires_at: new Date().toISOString() }).eq("id", params.id).eq("project_id", projectId);
  return new Response(null, { status: 303, headers: { Location: `/studio/projects/${projectId}/pulse/${error ? `?error=${encodeURIComponent("Consent could not be withdrawn.")}` : "?withdrawn=1"}` } });
};
