/**
 * Practice Commons auth callback parsing and redirect hardening.
 * Used by /auth/callback — no sensitive values are logged from here.
 */

export type AuthCallbackOtpType = "signup" | "magiclink" | "email";

const ACCEPTED_OTP_TYPES = new Set<AuthCallbackOtpType>([
  "signup",
  "magiclink",
  "email",
]);

/** Post-auth destinations used by current Practice Commons email flows. */
const ALLOWED_REDIRECTS = new Set([
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
 * Allow only known internal Practice Commons destinations.
 * Invalid / external / protocol-relative / malformed values fall back to /community/.
 */
export function safeAuthCallbackRedirect(
  value: string | null | undefined,
): string {
  if (typeof value !== "string" || !value.trim()) return "/community/";

  const decoded = decodeRedirectCandidate(value);
  if (!decoded) return "/community/";

  if (
    decoded.includes("://") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.includes("..")
  ) {
    return "/community/";
  }

  if (!decoded.startsWith("/")) return "/community/";

  const pathOnly = decoded.split("?")[0]?.split("#")[0] ?? "";
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) return "/community/";

  if (!ALLOWED_REDIRECTS.has(pathOnly)) return "/community/";

  if (pathOnly === "/community" || pathOnly === "/community/") return "/community/";
  if (pathOnly === "/community/account" || pathOnly === "/community/account/") {
    return "/community/account/";
  }

  return "/community/";
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
