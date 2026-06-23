import type { APIRoute } from "astro";

export const prerender = false;

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/community/";
  return value;
}

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"));

  if (!locals.supabase || !code) {
    return redirect("/auth/register/", 303);
  }

  const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Auth callback failed:", error);
    return redirect("/auth/register/", 303);
  }

  return redirect(redirectTo, 303);
};
