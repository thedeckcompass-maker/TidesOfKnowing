import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../lib/studio/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.user || !locals.supabase) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const artistProfileId = String(form.get("artist_profile_id") ?? "");
  const action = String(form.get("action") ?? "save");
  const query = locals.supabase.from("studio_artist_shortlists");
  const { error } = action === "remove"
    ? await query.delete().eq("creator_id", locals.user.id).eq("project_id", projectId).eq("artist_profile_id", artistProfileId)
    : await query.upsert({
        creator_id: locals.user.id,
        project_id: projectId,
        artist_profile_id: artistProfileId,
        note: String(form.get("note") ?? "").trim().slice(0, 1200),
      }, { onConflict: "creator_id,project_id,artist_profile_id" });
  return new Response(null, {
    status: 303,
    headers: { Location: error ? "/studio/artists/?error=The%20private%20shortlist%20could%20not%20be%20updated." : "/studio/artists/?saved=1" },
  });
};
