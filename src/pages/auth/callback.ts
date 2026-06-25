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

function tokenPreview(value: string | null): string {
  if (!value) return "not present";
  return `${value.slice(0, 8)}... (length ${value.length})`;
}

export const GET: APIRoute = async ({ url, locals, cookies }) => {
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const token = url.searchParams.get("token");
  const otpType = safeOtpType(url.searchParams.get("type"));
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"));
  const callbackReference = crypto.randomUUID();
  const callbackBranch = tokenHash ? "verifyOtp_token_hash" : code || token ? "exchangeCodeForSession_code" : "missing_auth_params";

  console.warn("TEMP Practice Commons auth callback received", {
    reference: callbackReference,
    callbackBranch,
    pathname: url.pathname,
    hasCode: Boolean(code),
    code: tokenPreview(code),
    hasTokenHash: Boolean(tokenHash),
    tokenHash: tokenPreview(tokenHash),
    hasToken: Boolean(token),
    token: tokenPreview(token),
    rawType: url.searchParams.get("type"),
    otpType,
    redirectTo,
  });

  if (!locals.supabase) {
    console.error("Practice Commons auth callback missing Supabase client", {
      reference: callbackReference,
      callbackBranch,
    });
    return authRedirect("/auth/register/", cookies);
  }

  if (!code && !tokenHash && !token) {
    console.error("Practice Commons auth callback missing code, token_hash, and token", {
      reference: callbackReference,
      callbackBranch,
    });
    return authRedirect("/auth/register/", cookies);
  }

  console.warn("TEMP Practice Commons auth callback executing branch", {
    reference: callbackReference,
    callbackBranch,
  });

  const { error } = tokenHash
    ? await locals.supabase.auth.verifyOtp({
          token_hash: tokenHash ?? "",
          type: otpType,
        })
    : await locals.supabase.auth.exchangeCodeForSession(code ?? token ?? "");

  if (error) {
    console.error("Practice Commons auth callback session exchange failed", {
      reference: callbackReference,
      callbackBranch,
      errorName: error.name,
      errorCode: "code" in error ? error.code : null,
      errorMessage: error.message,
      errorStatus: "status" in error ? error.status : null,
      otpType,
      redirectTo,
    });
    return authRedirect("/auth/register/", cookies);
  }

  console.warn("TEMP Practice Commons auth callback succeeded", {
    reference: callbackReference,
    callbackBranch,
    redirectTo,
  });

  return authRedirect(redirectTo, cookies);
};
