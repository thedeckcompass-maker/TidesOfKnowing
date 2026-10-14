import type { APIRoute } from "astro";
import { parseStudioArtistApplication } from "../../../lib/studio/validation";

export const prerender = false;

function redirect(key: "submitted" | "error", value: string): Response {
  return new Response(null, { status: 303, headers: { Location: `/artists/collaborate/?${key}=${encodeURIComponent(value)}` } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.supabase) {
    return new Response(null, { status: 303, headers: { Location: "/auth/register/?redirectTo=%2Fartists%2Fcollaborate%2F" } });
  }
  const parsed = parseStudioArtistApplication(await request.formData());
  if (!parsed.ok) return redirect("error", parsed.error);
  const { contact_email, website_url, ...profile } = parsed.value;
  const { data, error } = await locals.supabase
    .from("studio_artist_profiles")
    .upsert({
      user_id: locals.user.id,
      ...profile,
      status: "submitted",
      display_rights_confirmed_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      published_at: null,
    }, { onConflict: "user_id" })
    .select("id")
    .single();
  if (error || !data) {
    console.error("Unable to save Studio artist application:", error);
    return redirect("error", "The artist application could not be saved.");
  }
  const { error: contactError } = await locals.supabase.from("studio_artist_contacts").upsert({
    artist_profile_id: data.id,
    user_id: locals.user.id,
    contact_email,
    website_url,
  }, { onConflict: "artist_profile_id" });
  if (contactError) {
    console.error("Unable to save private artist contact:", contactError);
    return redirect("error", "The private contact details could not be saved.");
  }
  return redirect("submitted", "1");
};
