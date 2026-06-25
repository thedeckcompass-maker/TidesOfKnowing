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
      key === "code" || key === "token_hash" || key === "token"
        ? tokenPreview(value)
        : value,
    ]),
  );
}

function rawCallbackParams(url: URL) {
  return Object.fromEntries(
    [...url.searchParams.entries()].map(([key, value]) => [
      key,
      key === "code" || key === "token_hash" || key === "token"
        ? tokenPreview(value)
        : value,
    ]),
  );
}

function responseCookieNames(cookies: Parameters<APIRoute>[0]["cookies"]): string[] {
  return Array.from(cookies.headers())
    .flatMap((header) => header.split(";"))
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tokenPreview(value: string | null): string {
  if (!value) return "not present";
  return `${value.slice(0, 8)}... (length ${value.length})`;
}

function redactedCallbackUrl(url: URL): string {
  const redacted = new URL(url.href);
  for (const key of ["code", "token", "token_hash"]) {
    const value = redacted.searchParams.get(key);
    if (value) redacted.searchParams.set(key, tokenPreview(value));
  }
  return redacted.href;
}

function diagnosticResponse({
  url,
  redirectTo,
  rawOtpType,
  otpType,
  code,
  token,
  tokenHash,
  branch,
  reason,
  supabaseErrorMessage,
}: {
  url: URL;
  redirectTo: string;
  rawOtpType: string | null;
  otpType: SupabaseOtpType;
  code: string | null;
  token: string | null;
  tokenHash: string | null;
  branch: string;
  reason: string;
  supabaseErrorMessage?: string;
}): Response {
  const queryRows = [...url.searchParams.entries()]
    .map(([key, value]) => {
      const displayValue =
        key === "code" || key === "token" || key === "token_hash"
          ? tokenPreview(value)
          : value;
      return `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(displayValue)}</td></tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Practice Commons Auth Callback Diagnostic</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; color: #172033; }
      main { max-width: 56rem; }
      h1 { font-size: 1.5rem; }
      dl, table { width: 100%; }
      dt, th { font-weight: 700; text-align: left; vertical-align: top; width: 14rem; }
      dd { margin: 0 0 0.75rem; }
      td, th { border-top: 1px solid #ddd; padding: 0.45rem 0.5rem; word-break: break-word; }
      code { background: #f4f1eb; padding: 0.1rem 0.25rem; border-radius: 0.2rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>Practice Commons Auth Callback Diagnostic</h1>
      <p>This temporary page replaces the failure redirect for debugging only.</p>
      <dl>
        <dt>Execution branch</dt>
        <dd><code>${escapeHtml(branch)}</code></dd>
        <dt>Failure reason</dt>
        <dd>${escapeHtml(reason)}</dd>
        <dt>Full callback URL</dt>
        <dd><code>${escapeHtml(redactedCallbackUrl(url))}</code></dd>
        <dt>Pathname</dt>
        <dd><code>${escapeHtml(url.pathname)}</code></dd>
        <dt>redirectTo</dt>
        <dd><code>${escapeHtml(redirectTo)}</code></dd>
        <dt>Raw type</dt>
        <dd><code>${escapeHtml(rawOtpType ?? "not present")}</code></dd>
        <dt>Normalized type</dt>
        <dd><code>${escapeHtml(otpType)}</code></dd>
        <dt>Code present?</dt>
        <dd>${code ? `yes: <code>${escapeHtml(tokenPreview(code))}</code>` : "no"}</dd>
        <dt>Token present?</dt>
        <dd>${token ? `yes: <code>${escapeHtml(tokenPreview(token))}</code>` : "no"}</dd>
        <dt>token_hash present?</dt>
        <dd>${tokenHash ? `yes: <code>${escapeHtml(tokenPreview(tokenHash))}</code>` : "no"}</dd>
        <dt>Supabase error message</dt>
        <dd>${supabaseErrorMessage ? escapeHtml(supabaseErrorMessage) : "none"}</dd>
      </dl>
      <h2>Query Parameters</h2>
      <table>
        <tbody>
          ${queryRows || `<tr><td colspan="2">No query parameters received.</td></tr>`}
        </tbody>
      </table>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ url, locals, redirect, cookies }) => {
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const token = url.searchParams.get("token");
  const rawOtpType = url.searchParams.get("type");
  const otpType = safeOtpType(rawOtpType);
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"));
  const callbackReference = crypto.randomUUID();

  console.warn("TEMP Practice Commons auth callback diagnostic", {
    reference: callbackReference,
    fullCallbackUrl: redactedCallbackUrl(url),
    pathname: url.pathname,
    searchParams: rawCallbackParams(url),
    tokenPresent: Boolean(token),
    codePresent: Boolean(code),
    tokenHashPresent: Boolean(tokenHash),
    rawType: rawOtpType,
    type: otpType,
    redirectTo,
    branch: "received",
  });

  console.info("Practice Commons auth callback received", {
    reference: callbackReference,
    requestUrl: redactedCallbackUrl(url),
    pathname: url.pathname,
    searchParams: callbackParams(url),
    hasCode: Boolean(code),
    code: tokenPreview(code),
    hasTokenHash: Boolean(tokenHash),
    tokenHash: tokenPreview(tokenHash),
    hasToken: Boolean(token),
    token: tokenPreview(token),
    otpType,
    redirectTo,
  });

  if (!locals.supabase) {
    console.error("TEMP Practice Commons auth callback redirecting to register", {
      reference: callbackReference,
      fullCallbackUrl: redactedCallbackUrl(url),
      pathname: url.pathname,
      searchParams: rawCallbackParams(url),
      tokenPresent: Boolean(token),
      codePresent: Boolean(code),
      tokenHashPresent: Boolean(tokenHash),
      rawType: rawOtpType,
      type: otpType,
      redirectTo,
      branch: "redirect_register_missing_supabase_client",
      reason: "Astro locals did not include a Supabase client, so no session exchange can be attempted.",
    });
    console.error("Practice Commons auth callback missing Supabase client", {
      reference: callbackReference,
      redirectTo,
    });
    return diagnosticResponse({
      url,
      redirectTo,
      rawOtpType,
      otpType,
      code,
      token,
      tokenHash,
      branch: "redirect_register_missing_supabase_client",
      reason: "Astro locals did not include a Supabase client, so no session exchange can be attempted.",
    });
  }

  if (!code && !tokenHash && !token) {
    console.error("TEMP Practice Commons auth callback redirecting to register", {
      reference: callbackReference,
      fullCallbackUrl: redactedCallbackUrl(url),
      pathname: url.pathname,
      searchParams: rawCallbackParams(url),
      tokenPresent: false,
      codePresent: false,
      tokenHashPresent: false,
      rawType: rawOtpType,
      type: otpType,
      redirectTo,
      branch: "redirect_register_missing_auth_params",
      reason: "Callback URL has no code, token_hash, or token, so the callback cannot exchange or verify a Supabase session.",
    });
    console.error("Practice Commons auth callback missing code, token_hash, and token", {
      reference: callbackReference,
      requestUrl: redactedCallbackUrl(url),
      searchParams: callbackParams(url),
      redirectTo,
    });
    return diagnosticResponse({
      url,
      redirectTo,
      rawOtpType,
      otpType,
      code,
      token,
      tokenHash,
      branch: "redirect_register_missing_auth_params",
      reason: "Callback URL has no code, token_hash, or token, so the callback cannot exchange or verify a Supabase session.",
    });
  }

  const exchangeMode = code ? "code" : tokenHash ? "token_hash" : "token";
  console.warn("TEMP Practice Commons auth callback execution branch", {
    reference: callbackReference,
    fullCallbackUrl: redactedCallbackUrl(url),
    pathname: url.pathname,
    searchParams: rawCallbackParams(url),
    tokenPresent: Boolean(token),
    codePresent: Boolean(code),
    tokenHashPresent: Boolean(tokenHash),
    rawType: rawOtpType,
    type: otpType,
    redirectTo,
    branch: `exchange_${exchangeMode}`,
  });
  console.info("Practice Commons auth callback starting session exchange", {
    reference: callbackReference,
    exchangeMode,
    otpType,
    redirectTo,
  });

  const { error } =
    code || token
      ? await locals.supabase.auth.exchangeCodeForSession(code ?? token ?? "")
      : await locals.supabase.auth.verifyOtp({
          token_hash: tokenHash ?? "",
          type: otpType,
        });
  const exchangeCookieNames = responseCookieNames(cookies);

  console.info("Practice Commons auth callback session exchange completed", {
    reference: callbackReference,
    exchangeMode,
    otpType,
    exchangeError: error
      ? {
          name: error.name,
          code: "code" in error ? error.code : null,
          message: error.message,
          status: "status" in error ? error.status : null,
        }
      : null,
    setCookieNames: exchangeCookieNames,
    redirectTo,
  });

  if (error) {
    console.error("TEMP Practice Commons auth callback redirecting to register", {
      reference: callbackReference,
      fullCallbackUrl: redactedCallbackUrl(url),
      pathname: url.pathname,
      searchParams: rawCallbackParams(url),
      tokenPresent: Boolean(token),
      codePresent: Boolean(code),
      tokenHashPresent: Boolean(tokenHash),
      rawType: rawOtpType,
      type: otpType,
      redirectTo,
      branch: "redirect_register_exchange_error",
      reason: "Supabase session exchange returned an error.",
      exchangeMode,
      errorName: error.name,
      errorCode: "code" in error ? error.code : null,
      errorMessage: error.message,
      errorStatus: "status" in error ? error.status : null,
      setCookieNames: exchangeCookieNames,
    });
    console.error("Practice Commons auth callback session exchange failed", {
      reference: callbackReference,
      errorName: error.name,
      errorCode: "code" in error ? error.code : null,
      errorMessage: error.message,
      errorStatus: "status" in error ? error.status : null,
      exchangeMode,
      otpType,
      setCookieNames: exchangeCookieNames,
      redirectTo,
    });
    return diagnosticResponse({
      url,
      redirectTo,
      rawOtpType,
      otpType,
      code,
      token,
      tokenHash,
      branch: "redirect_register_exchange_error",
      reason: "Supabase session exchange returned an error.",
      supabaseErrorMessage: error.message,
    });
  }

  const {
    data: { session },
    error: sessionError,
  } = await locals.supabase.auth.getSession();
  const cookieNames = responseCookieNames(cookies);

  console.info("Practice Commons auth callback session exchange succeeded", {
    reference: callbackReference,
    exchangeMode,
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

  console.info("Practice Commons auth callback redirecting after exchange", {
    reference: callbackReference,
    exchangeMode,
    sessionPresent: Boolean(session),
    setCookieNames: cookieNames,
    redirectTo,
  });

  console.warn("TEMP Practice Commons auth callback execution branch", {
    reference: callbackReference,
    fullCallbackUrl: redactedCallbackUrl(url),
    pathname: url.pathname,
    searchParams: rawCallbackParams(url),
    tokenPresent: Boolean(token),
    codePresent: Boolean(code),
    tokenHashPresent: Boolean(tokenHash),
    rawType: rawOtpType,
    type: otpType,
    redirectTo,
    branch: "redirect_success",
    exchangeMode,
    sessionPresent: Boolean(session),
    setCookieNames: cookieNames,
  });

  return redirect(redirectTo, 303);
};
