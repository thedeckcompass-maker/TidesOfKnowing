import type { APIRoute } from "astro";
import {
  isValidAuthCallbackTokenHash,
  logAuthCallbackEvent,
  parseAuthCallbackOtpType,
  safeAuthCallbackRedirect,
} from "../../lib/community/authCallback";
import { authRedirect } from "../../lib/community/supabaseServer";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, cookies }) => {
  const invocationId = crypto.randomUUID();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const rawType = url.searchParams.get("type");
  const otpType = parseAuthCallbackOtpType(rawType);
  const redirectTo = safeAuthCallbackRedirect(url.searchParams.get("redirectTo"));

  logAuthCallbackEvent({
    invocationId,
    event: "callback_received",
    status: "received",
    hasTokenHash: Boolean(tokenHash),
    hasCode: Boolean(code),
    otpType,
    redirectPath: redirectTo,
  });

  if (!locals.supabase) {
    logAuthCallbackEvent({
      invocationId,
      event: "callback_rejected",
      status: "missing_supabase",
      redirectPath: redirectTo,
    });
    return authRedirect("/auth/register/", cookies);
  }

  // Primary email-link path: TokenHash templates.
  if (tokenHash !== null || rawType !== null) {
    if (!isValidAuthCallbackTokenHash(tokenHash) || !tokenHash) {
      logAuthCallbackEvent({
        invocationId,
        event: "callback_rejected",
        status: "missing_or_invalid_token_hash",
        hasTokenHash: Boolean(tokenHash),
        otpType,
        redirectPath: redirectTo,
      });
      return authRedirect("/auth/register/", cookies);
    }

    if (!otpType) {
      logAuthCallbackEvent({
        invocationId,
        event: "callback_rejected",
        status: rawType === null || rawType.trim() === "" ? "missing_or_empty_type" : "unsupported_type",
        hasTokenHash: true,
        otpType: rawType,
        redirectPath: redirectTo,
      });
      return authRedirect("/auth/register/", cookies);
    }

    const verifiedTokenHash = tokenHash.trim();
    const { error } = await locals.supabase.auth.verifyOtp({
      token_hash: verifiedTokenHash,
      type: otpType,
    });

    if (error) {
      logAuthCallbackEvent({
        invocationId,
        event: "callback_verify_failed",
        status: "verify_otp_failed",
        hasTokenHash: true,
        otpType,
        redirectPath: redirectTo,
      });
      return authRedirect("/auth/register/", cookies);
    }

    logAuthCallbackEvent({
      invocationId,
      event: "callback_succeeded",
      status: "accepted",
      hasTokenHash: true,
      otpType,
      redirectPath: redirectTo,
    });
    return authRedirect(redirectTo, cookies);
  }

  // Secondary PKCE code exchange (no email token_hash / type query params).
  if (code) {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logAuthCallbackEvent({
        invocationId,
        event: "callback_verify_failed",
        status: "exchange_code_failed",
        hasCode: true,
        redirectPath: redirectTo,
      });
      return authRedirect("/auth/register/", cookies);
    }

    logAuthCallbackEvent({
      invocationId,
      event: "callback_succeeded",
      status: "accepted",
      hasCode: true,
      redirectPath: redirectTo,
    });
    return authRedirect(redirectTo, cookies);
  }

  logAuthCallbackEvent({
    invocationId,
    event: "callback_rejected",
    status: "missing_auth_params",
    redirectPath: redirectTo,
  });
  return authRedirect("/auth/register/", cookies);
};
