import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../../lib/community/auth";
import { createCommunityServiceClient } from "../../../../../lib/community/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!locals.user || !isAdminProfile(locals.profile) || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  if (action !== "approve" && action !== "decline") {
    return new Response(null, { status: 303, headers: { Location: "/studio/admin/artists/?error=Choose%20a%20valid%20review%20action." } });
  }
  const now = new Date().toISOString();
  const service = createCommunityServiceClient(locals);
  const { error } = await service.from("studio_artist_profiles").update({
    status: action === "approve" ? "approved" : "declined",
    reviewed_by: locals.user.id,
    reviewed_at: now,
    published_at: action === "approve" ? now : null,
  }).eq("id", params.id).eq("status", "submitted");
  return new Response(null, {
    status: 303,
    headers: { Location: error ? "/studio/admin/artists/?error=The%20artist%20review%20could%20not%20be%20saved." : "/studio/admin/artists/?saved=1" },
  });
};
