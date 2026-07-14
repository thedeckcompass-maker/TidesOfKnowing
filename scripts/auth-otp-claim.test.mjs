import assert from "node:assert/strict";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeAuthOtpSubmissionId(submissionId) {
  const id = typeof submissionId === "string" ? submissionId.trim() : "";
  if (!id || !UUID_RE.test(id)) return null;
  return id.toLowerCase();
}

function normalizeAuthOtpClaimMode(authMode) {
  if (authMode === "sign-in") return "sign-in";
  if (authMode === "resend") return "resend";
  if (authMode === "account-sign-in-link") return "account-sign-in-link";
  return "join";
}

function createAuthOtpSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const nibble = (Math.random() * 16) | 0;
    const value = char === "x" ? nibble : (nibble & 0x3) | 0x8;
    return value.toString(16);
  });
}

assert.equal(normalizeAuthOtpSubmissionId(null), null);
assert.equal(normalizeAuthOtpSubmissionId(""), null);
assert.equal(normalizeAuthOtpSubmissionId("not-a-uuid"), null);
assert.equal(
  normalizeAuthOtpSubmissionId("815686d0-e4a5-4c14-82cc-26159b2e7c92"),
  "815686d0-e4a5-4c14-82cc-26159b2e7c92",
);
assert.equal(
  normalizeAuthOtpSubmissionId("815686D0-E4A5-4C14-82CC-26159B2E7C92"),
  "815686d0-e4a5-4c14-82cc-26159b2e7c92",
);
assert.equal(normalizeAuthOtpClaimMode("sign-in"), "sign-in");
assert.equal(normalizeAuthOtpClaimMode("resend"), "resend");
assert.equal(normalizeAuthOtpClaimMode("account-sign-in-link"), "account-sign-in-link");
assert.equal(normalizeAuthOtpClaimMode("join"), "join");
assert.equal(normalizeAuthOtpClaimMode("other"), "join");
assert.match(createAuthOtpSubmissionId(), UUID_RE);

console.log("auth otp claim helpers passed");
