import {servicePurchase} from '../studio/servicePurchase';
/**
 * Practice Commons auth callback parsing and redirect hardening.
 * Used by /auth/callback — no sensitive values are logged from here.
 *
 * TokenHash email links standardise on `type=email` to match current
 * @supabase/supabase-js / auth-js PKCE examples (Confirm Signup and Magic Link).
 * `signup` / `magiclink` remain EmailOtpType values in the SDK but are not used
 * in this project's planned dashboard TokenHash templates.
 *
 * Planned dashboard hrefs (manual — not applied by this repo):
 * Confirm Signup: {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
 * Magic Link:     {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
 */

export type AuthCallbackOtpType = "email" | "recovery";


/** Manual Supabase Confirm Signup / Magic Link TokenHash query (type=email). */
export const AUTH_CALLBACK_TOKEN_HASH_TYPE = "email" as const;

export const PLANNED_CONFIRM_SIGNUP_TOKEN_HASH_HREF =
  "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email";

export const PLANNED_MAGIC_LINK_TOKEN_HASH_HREF =
  "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email";

const ACCEPTED_OTP_TYPES = new Set<AuthCallbackOtpType>([
  AUTH_CALLBACK_TOKEN_HASH_TYPE,  'recovery',

]);

/** Legacy account routes retained for shared account continuity. */
const ALLOWED_REDIRECTS = new Set([  '/auth/password-update/',
  '/auth/password-update',

  "/community",
  "/community/",
  "/community/account",
  "/community/account/",
]);

export function parseAuthCallbackOtpType(
  value: string | null | undefined,
): AuthCallbackOtpType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (!ACCEPTED_OTP_TYPES.has(normalized as AuthCallbackOtpType)) return null;
  return normalized as AuthCallbackOtpType;
}

export function isValidAuthCallbackTokenHash(
  value: string | null | undefined,
): boolean {
  if (typeof value !== "string") return false;
  const tokenHash = value.trim();
  if (!tokenHash) return false;
  if (tokenHash.length < 20 || tokenHash.length > 512) return false;
  if (/\s/.test(tokenHash)) return false;
  return true;
}

function decodeRedirectCandidate(value: string): string | null {
  let current = value.trim();
  if (!current) return null;

  // Decode a bounded number of times to catch encoded external targets.
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      return null;
    }
  }

  return current;
}

/**
 * Allow existing Studio, artist and shared account destinations.
 * Invalid / external / protocol-relative / malformed values fall back to /studio/.
 */
export function safeAuthCallbackRedirect(
  value: string | null | undefined,
): string {
  if (typeof value !== "string" || !value.trim()) return "/studio/";

  const decoded = decodeRedirectCandidate(value);
  if (!decoded) return "/studio/";

  if (
    decoded.includes("://") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.includes("..")
  ) {
    return "/studio/";
  }

  if (!decoded.startsWith("/")) return "/studio/";

  const pathOnly = decoded.split("?")[0]?.split("#")[0] ?? "";
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) return "/studio/";

  // Only an existing validated plan may survive an authentication round trip.
  if (pathOnly === '/deck-creator-studio/checkout/' || pathOnly === '/deck-creator-studio/checkout') {
    const target = new URL(decoded, 'https://studio.invalid');
    const keys = [...target.searchParams.keys()];
    if (target.hash || keys.length !== 2 || target.searchParams.getAll('offer').length !== 1 || target.searchParams.getAll('billing').length !== 1) return '/studio/';
    const choice = servicePurchase(target.searchParams.get('offer'), target.searchParams.get('billing'));
    return choice ? '/deck-creator-studio/checkout/?offer=' + choice.offer + '&billing=' + choice.billing : '/studio/';
  }
  // Studio return paths are internal page paths only; discard query/fragment.
  if (/^\/studio(?:\/[A-Za-z0-9_-]+)*\/?$/.test(pathOnly)) return pathOnly.endsWith("/") ? pathOnly : pathOnly + "/";

  if (['/artists/collaborate','/artists/collaborate/','/artists/visual-design-exchange','/artists/visual-design-exchange/'].includes(pathOnly)) return pathOnly.endsWith('/') ? pathOnly : pathOnly+'/';

  if (!ALLOWED_REDIRECTS.has(pathOnly)) return "/studio/";  if (pathOnly === '/auth/password-update' || pathOnly === '/auth/password-update/') return '/auth/password-update/';


  if (pathOnly === "/community" || pathOnly === "/community/") return "/studio/";
  if (pathOnly === "/community/account" || pathOnly === "/community/account/") {
    return "/community/account/?workspace=studio";
  }

  return "/studio/";
}

export type AuthCallbackLogFields = {
  invocationId: string;
  event: string;
  status: string;
  hasTokenHash?: boolean;
  hasCode?: boolean;
  otpType?: string | null;
  redirectPath?: string;
};

const AUTH_CALLBACK_LOG_KEYS = new Set([
  "channel",
  "timestamp",
  "invocationId",
  "event",
  "status",
  "hasTokenHash",
  "hasCode",
  "otpType",
  "redirectPath",
]);

export function sanitizeAuthCallbackLogFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!AUTH_CALLBACK_LOG_KEYS.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

export function logAuthCallbackEvent(fields: AuthCallbackLogFields): void {
  const payload = sanitizeAuthCallbackLogFields({
    channel: "pc-auth-callback",
    timestamp: new Date().toISOString(),
    ...fields,
  });
  console.info(JSON.stringify(payload));
}

/** Preserve entry context only for validated Studio and the two existing artist pages. */
export function isStudioAuthReturn(value:string):boolean {
 const path=safeAuthCallbackRedirect(value);
 return path.startsWith('/deck-creator-studio/checkout/?offer=')||path==='/community/account/?workspace=studio'||path.startsWith('/studio/')||path==='/artists/collaborate/'||path==='/artists/visual-design-exchange/';
}
