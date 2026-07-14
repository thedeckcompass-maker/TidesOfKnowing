/**
 * Structured Practice Commons auth OTP logs.
 * Only operational fields — never email, tokens, URLs, bodies, or provider objects.
 */

export type AuthOtpLogStatus =
  | "received"
  | "rejected_missing_submission"
  | "claim_duplicate"
  | "claim_unavailable"
  | "provider_started"
  | "provider_completed"
  | "provider_failed"
  | "accepted"
  | "failed";

export type AuthOtpLogFields = {
  submissionId: string | null;
  invocationId: string;
  authMode: string;
  event: string;
  claimResult?: string;
  providerDurationMs?: number;
  totalDurationMs?: number;
  status?: AuthOtpLogStatus | string;
};

const ALLOWED_KEYS = new Set([
  "channel",
  "timestamp",
  "submissionId",
  "invocationId",
  "authMode",
  "event",
  "claimResult",
  "providerDurationMs",
  "totalDurationMs",
  "status",
]);

export function sanitizeAuthOtpLogFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

export function logAuthOtpEvent(fields: AuthOtpLogFields): void {
  const payload = sanitizeAuthOtpLogFields({
    channel: "pc-auth-otp",
    timestamp: new Date().toISOString(),
    ...fields,
  });
  console.info(JSON.stringify(payload));
}
