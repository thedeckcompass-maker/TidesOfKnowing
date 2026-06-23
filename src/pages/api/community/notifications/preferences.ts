import type { APIRoute } from "astro";
import { json, parseJsonOrForm } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user) {
    return json({ ok: false, error: "Please log in first." }, 401);
  }

  const payload = await parseJsonOrForm(request);
  const service = createCommunityServiceClient(locals);

  const { error } = await service.from("notification_preferences").upsert(
    {
      user_id: locals.user.id,
      email_replies_to_posts: payload.emailRepliesToPosts === "on" || payload.emailRepliesToPosts === true,
      email_announcements: payload.emailAnnouncements === "on" || payload.emailAnnouncements === true,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Unable to update notification preferences:", error);
    return json({ ok: false, error: "Unable to update email preferences." }, 500);
  }

  return redirect("/community/account/", 303);
};
