/**
 * Client-safe OTP submission UUID helpers.
 * Do not import server-only modules (service role, Supabase admin) here.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeAuthOtpSubmissionId(
  submissionId: string | null | undefined,
): string | null {
  const id = typeof submissionId === "string" ? submissionId.trim() : "";
  if (!id || !UUID_RE.test(id)) return null;
  return id.toLowerCase();
}

export function createAuthOtpSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const nibble = (Math.random() * 16) | 0;
    const value = char === "x" ? nibble : (nibble & 0x3) | 0x8;
    return value.toString(16);
  });
}
