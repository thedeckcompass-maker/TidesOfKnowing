import type { APIRoute } from "astro";

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

function callbackParams(url: URL) {
  return Object.fromEntries(
    [...url.searchParams.entries()].map(([key, value]) => [
      key,
      key === "code" || key === "token_hash" ? `${value.slice(0, 8)}...` : value,
    ]),
  );
}

export const GET: APIRoute = async ({ url, locals, redirect, cookies }) => {
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = safeOtpType(url.searchParams.get("type"));
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"));
  const callbackReference = crypto.randomUUID();

  console.info("Practice Commons auth callback received", {
    reference: callbackReference,
    requestUrl: url.href,
    searchParams: callbackParams(url),
    hasCode: Boolean(code),
    code: code ? `${code.slice(0, 8)}...` : null,
    hasTokenHash: Boolean(tokenHash),
    tokenHash: tokenHash ? `${tokenHash.slice(0, 8)}...` : null,
    otpType,
    redirectTo,
  });

  if (!locals.supabase) {
    console.error("Practice Commons auth callback missing Supabase client", {
      reference: callbackReference,
      redirectTo,
    });
    return redirect("/auth/register/", 303);
  }

  if (!code && !tokenHash) {
    console.error("Practice Commons auth callback missing code and token_hash", {
      reference: callbackReference,
      requestUrl: url.href,
      searchParams: callbackParams(url),
      redirectTo,
    });
    return redirect("/auth/register/", 303);
  }

  const { error } = code
    ? await locals.supabase.auth.exchangeCodeForSession(code)
    : await locals.supabase.auth.verifyOtp({
        token_hash: tokenHash ?? "",
        type: otpType,
      });

  if (error) {
    console.error("Practice Commons auth callback session exchange failed", {
      reference: callbackReference,
      errorName: error.name,
      errorCode: "code" in error ? error.code : null,
      errorMessage: error.message,
      errorStatus: "status" in error ? error.status : null,
      exchangeMode: code ? "code" : "token_hash",
      otpType,
      redirectTo,
    });
    return redirect("/auth/register/", 303);
  }

  const {
    data: { session },
    error: sessionError,
  } = await locals.supabase.auth.getSession();
  const cookieNames = cookies
    .headers()
    .flatMap((header) => header.split(";"))
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean);

  console.info("Practice Commons auth callback session exchange succeeded", {
    reference: callbackReference,
    exchangeMode: code ? "code" : "token_hash",
    otpType,
    sessionPresent: Boolean(session),
    userId: session?.user?.id ?? null,
    sessionError: sessionError
      ? {
          name: sessionError.name,
          message: sessionError.message,
        }
      : null,
    setCookieNames: cookieNames,
    redirectTo,
  });

  return redirect(redirectTo, 303);
};
