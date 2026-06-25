import type { APIRoute } from "astro";
import { authRedirect } from "../../lib/community/supabaseServer";

export const prerender = false;

async function signOut(locals: App.Locals) {
  if (locals.supabase) {
    await locals.supabase.auth.signOut();
  }
}

export const GET: APIRoute = async ({ locals, cookies }) => {
  await signOut(locals);
  return authRedirect("/community/?signed_out=true", cookies);
};

export const POST: APIRoute = async ({ locals, cookies }) => {
  await signOut(locals);
  return authRedirect("/community/?signed_out=true", cookies);
};
