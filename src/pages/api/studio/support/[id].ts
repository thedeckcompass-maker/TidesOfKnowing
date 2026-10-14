import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../lib/studio/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !locals.user || !params.id) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const now = new Date().toISOString();
  const { error } = await locals.supabase
    .from("studio_support_requests")
    .update({ status: "withdrawn", consent_withdrawn_at: now, access_expires_at: now })
    .eq("id", params.id)
    .eq("project_id", projectId)
    .eq("owner_id", locals.user.id)
    .in("status", ["requested", "accepted"]);

  return new Response(null, {
    status: 303,
    headers: {
      Location: error
        ? `/studio/projects/${projectId}/support/?error=${encodeURIComponent("The support request could not be withdrawn.")}`
        : `/studio/projects/${projectId}/support/?withdrawn=1`,
    },
  });
};
