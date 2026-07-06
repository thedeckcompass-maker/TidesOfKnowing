import type { APIRoute } from "astro";
import { json } from "../../../../lib/community/api";

export const prerender = false;

export const POST: APIRoute = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ ok: false, error: "Please log in first." }, 401);
  }

  if (!locals.supabase) {
    return json({ ok: false, error: "Sign-in is not configured yet." }, 503);
  }

  const email = locals.user.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return json({ ok: false, error: "Unable to send a sign-in link for this account." }, 400);
  }

  const redirectTo = "/community/account/";
  const emailRedirectTo = new URL(
    `/auth/callback/?redirectTo=${encodeURIComponent(redirectTo)}`,
    url,
  ).href;

  const { error } = await locals.supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error("Account sign-in link request failed:", error);
    return json({ ok: false, error: "Unable to send a sign-in link right now. Please try again." }, 500);
  }

  return json({ ok: true });
};
