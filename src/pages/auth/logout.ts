import type { APIRoute } from "astro";

export const prerender = false;

async function signOut(locals: App.Locals) {
  if (locals.supabase) {
    await locals.supabase.auth.signOut();
  }
}

export const GET: APIRoute = async ({ locals, redirect }) => {
  await signOut(locals);
  return redirect("/community/?signed_out=true", 303);
};

export const POST: APIRoute = async ({ locals, redirect }) => {
  await signOut(locals);
  return redirect("/community/?signed_out=true", 303);
};
