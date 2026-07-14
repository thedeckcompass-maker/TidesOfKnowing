#!/usr/bin/env node
/**
 * Practice Commons auth callback hardening — focused unit tests.
 * Run: node scripts/auth-callback.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function test(name, fn) {
  try {
    fn();
    console.log(`  ok — ${name}`);
    return true;
  } catch (err) {
    console.error(`  FAIL — ${name}`);
    console.error(`         ${err.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;
function run(name, fn) {
  if (test(name, fn)) passed += 1;
  else failed += 1;
}

/** Current PKCE TokenHash standard — Confirm Signup and Magic Link both use email. */
const ACCEPTED = new Set(["email"]);
const ALLOWED_REDIRECTS = new Set([
  "/community",
  "/community/",
  "/community/account",
  "/community/account/",
]);

const PLANNED_CONFIRM_SIGNUP_TOKEN_HASH_HREF =
  "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email";
const PLANNED_MAGIC_LINK_TOKEN_HASH_HREF =
  "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email";

function parseAuthCallbackOtpType(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (!ACCEPTED.has(normalized)) return null;
  return normalized;
}

function isValidAuthCallbackTokenHash(value) {
  if (typeof value !== "string") return false;
  const tokenHash = value.trim();
  if (!tokenHash) return false;
  if (tokenHash.length < 20 || tokenHash.length > 512) return false;
  if (/\s/.test(tokenHash)) return false;
  return true;
}

function decodeRedirectCandidate(value) {
  let current = value.trim();
  if (!current) return null;
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

function safeAuthCallbackRedirect(value) {
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

const LOG_KEYS = new Set([
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

function sanitizeAuthCallbackLogFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!LOG_KEYS.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

const SAMPLE_HASH = "pkce_539917fb0123456789abcdef01234567";

run("valid email for current Supabase TokenHash PKCE docs", () => {
  assert.equal(parseAuthCallbackOtpType("email"), "email");
  assert.equal(parseAuthCallbackOtpType("EMAIL"), "email");
});

run("signup and magiclink rejected — templates standardise on type=email", () => {
  assert.equal(parseAuthCallbackOtpType("signup"), null);
  assert.equal(parseAuthCallbackOtpType("SIGNUP"), null);
  assert.equal(parseAuthCallbackOtpType("magiclink"), null);
  assert.equal(parseAuthCallbackOtpType("magicLink"), null);
});

run("missing type", () => {
  assert.equal(parseAuthCallbackOtpType(null), null);
  assert.equal(parseAuthCallbackOtpType(undefined), null);
});

run("empty type", () => {
  assert.equal(parseAuthCallbackOtpType(""), null);
  assert.equal(parseAuthCallbackOtpType("   "), null);
});

run("unsupported type", () => {
  assert.equal(parseAuthCallbackOtpType("invite"), null);
  assert.equal(parseAuthCallbackOtpType("recovery"), null);
  assert.equal(parseAuthCallbackOtpType("email_change"), null);
  assert.equal(parseAuthCallbackOtpType("not-a-type"), null);
});

run("planned Confirm Signup and Magic Link templates use type=email", () => {
  assert.equal(
    PLANNED_CONFIRM_SIGNUP_TOKEN_HASH_HREF,
    "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email",
  );
  assert.equal(
    PLANNED_MAGIC_LINK_TOKEN_HASH_HREF,
    "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email",
  );
  const helperSrc = readFileSync(
    join(REPO_ROOT, "src/lib/community/authCallback.ts"),
    "utf8",
  );
  assert.match(helperSrc, /PLANNED_CONFIRM_SIGNUP_TOKEN_HASH_HREF[\s\S]*type=email/);
  assert.match(helperSrc, /PLANNED_MAGIC_LINK_TOKEN_HASH_HREF[\s\S]*type=email/);
  assert.match(helperSrc, /AuthCallbackOtpType = "email"/);
  assert.equal(/"signup"/.test(helperSrc), false);
  assert.equal(/"magiclink"/.test(helperSrc), false);
});

run("missing token_hash", () => {
  assert.equal(isValidAuthCallbackTokenHash(null), false);
  assert.equal(isValidAuthCallbackTokenHash(""), false);
  assert.equal(isValidAuthCallbackTokenHash("short"), false);
});

run("valid token_hash shape", () => {
  assert.equal(isValidAuthCallbackTokenHash(SAMPLE_HASH), true);
});

run("valid /community/ redirect", () => {
  assert.equal(safeAuthCallbackRedirect("/community/"), "/community/");
  assert.equal(safeAuthCallbackRedirect("%2Fcommunity%2F"), "/community/");
});

run("valid /community/account/ redirect", () => {
  assert.equal(safeAuthCallbackRedirect("/community/account/"), "/community/account/");
  assert.equal(
    safeAuthCallbackRedirect(encodeURIComponent("/community/account/")),
    "/community/account/",
  );
});

run("external redirect rejection", () => {
  assert.equal(safeAuthCallbackRedirect("https://evil.example/phish"), "/community/");
  assert.equal(safeAuthCallbackRedirect("http://evil.example"), "/community/");
});

run("protocol-relative redirect rejection", () => {
  assert.equal(safeAuthCallbackRedirect("//evil.example/phish"), "/community/");
});

run("encoded external redirect rejection", () => {
  assert.equal(safeAuthCallbackRedirect("%2F%2Fevil.example%2Fphish"), "/community/");
  assert.equal(
    safeAuthCallbackRedirect(encodeURIComponent(encodeURIComponent("//evil.example"))),
    "/community/",
  );
});

run("malformed redirect rejection", () => {
  assert.equal(safeAuthCallbackRedirect("/community/../admin"), "/community/");
  assert.equal(safeAuthCallbackRedirect("/\\evil"), "/community/");
  assert.equal(safeAuthCallbackRedirect("/auth/register/"), "/community/");
  assert.equal(safeAuthCallbackRedirect("community/"), "/community/");
  assert.equal(safeAuthCallbackRedirect("%E0%A4%A"), "/community/");
});

run("no sensitive callback data in logs", () => {
  const dirty = sanitizeAuthCallbackLogFields({
    channel: "pc-auth-callback",
    timestamp: "2026-07-14T00:00:00.000Z",
    invocationId: "inv-1",
    event: "callback_succeeded",
    status: "accepted",
    hasTokenHash: true,
    otpType: "email",
    redirectPath: "/community/",
    token: "secret-token",
    token_hash: SAMPLE_HASH,
    cookie: "sb-access-token=abc",
    session: { user: { id: "u1" } },
    callbackUrl: "https://example.test/auth/callback/?token_hash=abc",
    errorMessage: "do-not-log",
  });
  assert.deepEqual(Object.keys(dirty).sort(), [
    "channel",
    "event",
    "hasTokenHash",
    "invocationId",
    "otpType",
    "redirectPath",
    "status",
    "timestamp",
  ]);
  assert.equal("token" in dirty, false);
  assert.equal("token_hash" in dirty, false);
  assert.equal("cookie" in dirty, false);
  assert.equal("session" in dirty, false);
  assert.equal("callbackUrl" in dirty, false);

  const callbackSrc = readFileSync(join(REPO_ROOT, "src/pages/auth/callback.ts"), "utf8");
  const helperSrc = readFileSync(
    join(REPO_ROOT, "src/lib/community/authCallback.ts"),
    "utf8",
  );
  assert.match(callbackSrc, /logAuthCallbackEvent/);
  assert.equal(/error\.message/.test(callbackSrc), false);
  assert.equal(/console\.(info|error|warn)\([\s\S]*tokenHash/.test(callbackSrc), false);
  assert.equal(/console\.(info|error|warn)\([\s\S]*token_hash/.test(callbackSrc), false);
  assert.match(helperSrc, /no sensitive values are logged/i);
  assert.match(callbackSrc, /verifyOtp\(\{[\s\S]*type: otpType/);
  assert.match(callbackSrc, /parseAuthCallbackOtpType/);
  assert.equal(/safeOtpType/.test(callbackSrc), false);
  assert.equal(/return "email"/.test(callbackSrc), false);
});

run("callback rejects empty type before verifyOtp", () => {
  const callbackSrc = readFileSync(join(REPO_ROOT, "src/pages/auth/callback.ts"), "utf8");
  assert.match(callbackSrc, /missing_or_empty_type|unsupported_type/);
  assert.match(callbackSrc, /isValidAuthCallbackTokenHash/);
});

run("emailRedirectTo destinations for current flows", () => {
  const registerSrc = readFileSync(join(REPO_ROOT, "src/pages/auth/register.astro"), "utf8");
  const accountSrc = readFileSync(
    join(REPO_ROOT, "src/pages/api/community/account/sign-in-link.ts"),
    "utf8",
  );
  assert.match(registerSrc, /const next = "\/community\/"/);
  assert.match(accountSrc, /const redirectTo = "\/community\/account\/"/);
});

console.log("");
console.log(`auth callback tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
