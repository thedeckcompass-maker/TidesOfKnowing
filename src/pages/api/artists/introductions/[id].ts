import type { APIRoute } from "astro";

export const prerender = false;

const allowed = ["accepted", "declined", "more_information"] as const;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!locals.user || !locals.supabase || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  if (!allowed.includes(action as (typeof allowed)[number])) {
    return new Response(null, { status: 303, headers: { Location: "/artists/collaborate/?error=Choose%20a%20valid%20response." } });
  }
  const artistMessage = String(form.get("artist_message") ?? "").trim().slice(0, 2000);
  if (action === "more_information" && artistMessage.length < 10) {
    return new Response(null, { status: 303, headers: { Location: "/artists/collaborate/?error=Add%20the%20information%20you%20need." } });
  }
  const { error } = await locals.supabase.from("studio_artist_introductions").update({
    status: action,
    artist_message: artistMessage,
    responded_at: new Date().toISOString(),
  }).eq("id", params.id).eq("status", "requested");
  return new Response(null, {
    status: 303,
    headers: { Location: error ? "/artists/collaborate/?error=The%20response%20could%20not%20be%20saved." : "/artists/collaborate/?saved=1" },
  });
};
