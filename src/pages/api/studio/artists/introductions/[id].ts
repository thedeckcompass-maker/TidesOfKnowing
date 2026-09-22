import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.user || !locals.supabase || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const creatorReply = String(form.get("creator_reply") ?? "").trim().slice(0, 2000);
  const update: { status: string; creator_reply?: string } | null = action === "withdraw"
    ? { status: "withdrawn" }
    : action === "reply"
      ? { status: "requested", creator_reply: creatorReply }
      : null;
  if (!update || (action === "reply" && creatorReply.length < 10)) {
    return new Response(null, { status: 303, headers: { Location: "/studio/artists/?error=Choose%20a%20valid%20introduction%20action." } });
  }
  let query = locals.supabase.from("studio_artist_introductions").update(update).eq("id", params.id).eq("creator_id", locals.user.id);
  query = action === "reply" ? query.eq("status", "more_information") : query.in("status", ["requested", "more_information"]);
  const { error } = await query;
  return new Response(null, { status: 303, headers: { Location: error ? "/studio/artists/?error=The%20introduction%20could%20not%20be%20updated." : "/studio/artists/?saved=1" } });
};
