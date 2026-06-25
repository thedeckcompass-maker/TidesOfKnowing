import type { APIRoute } from "astro";
import { authRedirect } from "../../lib/community/supabaseServer";

export const prerender = false;

type SupabaseOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email";

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/community/";
  return value;
}

function safeOtpType(value: string | null): SupabaseOtpType {
  if (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  ) {
    return value;
  }

  return "email";
}

export const GET: APIRoute = async ({ url, locals, cookies }) => {
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const token = url.searchParams.get("token");
  const otpType = safeOtpType(url.searchParams.get("type"));
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"));

  if (!locals.supabase) {
    console.error("Practice Commons auth callback missing Supabase client");
    return authRedirect("/auth/register/", cookies);
  }

  if (!code && !tokenHash && !token) {
    console.error("Practice Commons auth callback missing code, token_hash, and token");
    return authRedirect("/auth/register/", cookies);
  }

  const { error } = tokenHash
    ? await locals.supabase.auth.verifyOtp({
          token_hash: tokenHash ?? "",
          type: otpType,
        })
    : await locals.supabase.auth.exchangeCodeForSession(code ?? token ?? "");

  if (error) {
    console.error("Practice Commons auth callback session exchange failed", {
      errorName: error.name,
      errorCode: "code" in error ? error.code : null,
      errorMessage: error.message,
      errorStatus: "status" in error ? error.status : null,
      otpType,
      redirectTo,
    });
    return authRedirect("/auth/register/", cookies);
  }

  return authRedirect(redirectTo, cookies);
};
