import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../lib/studio/access";
import { parseStudioArtistIntroduction } from "../../../../lib/studio/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.user || !locals.supabase) return new Response("Not found", { status: 404 });
  const parsed = parseStudioArtistIntroduction(await request.formData());
  if (!parsed.ok) return new Response(null, { status: 303, headers: { Location: `/studio/artists/?error=${encodeURIComponent(parsed.error)}` } });
  const { error } = await locals.supabase.from("studio_artist_introductions").insert({
    creator_id: locals.user.id,
    ...parsed.value,
  });
  const message = error?.code === "23505"
    ? "An introduction record already exists for this artist and project."
    : "The introduction request could not be saved.";
  return new Response(null, {
    status: 303,
    headers: { Location: error ? `/studio/artists/?error=${encodeURIComponent(message)}` : "/studio/artists/?requested=1" },
  });
};
