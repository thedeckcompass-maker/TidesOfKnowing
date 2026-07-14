#!/usr/bin/env node
/**
 * Account sign-in-link API OTP claim wiring — focused unit tests.
 * Run: node scripts/auth-otp-account-sign-in-link.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(
        () => {
          console.log(`  ok — ${name}`);
          return true;
        },
        (err) => {
          console.error(`  FAIL — ${name}`);
          console.error(`         ${err.message}`);
          return false;
        },
      );
    }
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
async function run(name, fn) {
  const ok = await test(name, fn);
  if (ok) passed += 1;
  else failed += 1;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUBMISSION = "a15686d0-e4a5-4c14-82cc-26159b2e7c92";
const ACCOUNT_MODE = "account-sign-in-link";

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

const ALLOWED_LOG_KEYS = new Set([
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

function sanitizeAuthOtpLogFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_LOG_KEYS.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

async function runAccountSignInLinkFlow(input, deps) {
  const authMode = normalizeAuthOtpClaimMode(ACCOUNT_MODE);
  const normalizedSubmissionId =
    normalizeAuthOtpSubmissionId(input.submissionId) ??
    normalizeAuthOtpSubmissionId(input.headerSubmissionId);

  if (!deps.user) {
    return { httpStatus: 401, ok: false, reason: "unauthorized", otpCalls: 0 };
  }
  if (!deps.supabaseConfigured) {
    return { httpStatus: 503, ok: false, reason: "unconfigured", otpCalls: 0 };
  }
  if (!input.email || !input.email.includes("@")) {
    return { httpStatus: 400, ok: false, reason: "invalid_account_email", otpCalls: 0 };
  }

  if (!normalizedSubmissionId) {
    return { httpStatus: 400, ok: false, reason: "missing_submission", otpCalls: 0 };
  }

  const claimResult = await deps.claim(normalizedSubmissionId, authMode);
  if (claimResult === "duplicate") {
    return { httpStatus: 200, ok: true, reason: "duplicate_claim", otpCalls: 0 };
  }
  if (claimResult !== "acquired") {
    return { httpStatus: 503, ok: false, reason: "claim_unavailable", otpCalls: 0 };
  }

  let otpCalls = 0;
  let signInError = null;
  try {
    otpCalls = 1;
    const result = await deps.signInWithOtp({
      email: input.email,
      shouldCreateUser: false,
      authMode,
    });
    signInError = result.error;
  } catch (caught) {
    signInError = caught;
  }

  if (signInError) {
    await deps.fail(normalizedSubmissionId);
    return { httpStatus: 500, ok: false, reason: "provider_error", otpCalls };
  }

  await deps.complete(normalizedSubmissionId);
  return { httpStatus: 200, ok: true, reason: "provider_success", otpCalls };
}

await run("valid first request calls signInWithOtp once", async () => {
  let completeCalls = 0;
  const result = await runAccountSignInLinkFlow(
    { submissionId: SUBMISSION, email: "member@example.com" },
    {
      user: { id: "u1" },
      supabaseConfigured: true,
      claim: async () => "acquired",
      complete: async () => {
        completeCalls += 1;
      },
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async (args) => {
        assert.equal(args.shouldCreateUser, false);
        assert.equal(args.authMode, ACCOUNT_MODE);
        return { error: null };
      },
    },
  );
  assert.equal(result.ok, true);
  assert.equal(result.otpCalls, 1);
  assert.equal(completeCalls, 1);
});

await run("duplicate UUID does not call Auth", async () => {
  const result = await runAccountSignInLinkFlow(
    { submissionId: SUBMISSION, email: "member@example.com" },
    {
      user: { id: "u1" },
      supabaseConfigured: true,
      claim: async () => "duplicate",
      complete: async () => {
        throw new Error("complete should not run");
      },
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async () => {
        throw new Error("Auth should not run");
      },
    },
  );
  assert.equal(result.ok, true);
  assert.equal(result.reason, "duplicate_claim");
  assert.equal(result.otpCalls, 0);
});

await run("missing or malformed UUID does not call Auth", async () => {
  for (const submissionId of [null, "", "not-a-uuid"]) {
    let claimCalls = 0;
    const result = await runAccountSignInLinkFlow(
      { submissionId, email: "member@example.com" },
      {
        user: { id: "u1" },
        supabaseConfigured: true,
        claim: async () => {
          claimCalls += 1;
          return "acquired";
        },
        complete: async () => {},
        fail: async () => {},
        signInWithOtp: async () => {
          throw new Error("Auth should not run");
        },
      },
    );
    assert.equal(result.ok, false);
    assert.equal(result.reason, "missing_submission");
    assert.equal(claimCalls, 0);
  }
});

await run("unavailable claim service fails closed", async () => {
  const result = await runAccountSignInLinkFlow(
    { submissionId: SUBMISSION, email: "member@example.com" },
    {
      user: { id: "u1" },
      supabaseConfigured: true,
      claim: async () => "unavailable",
      complete: async () => {
        throw new Error("complete should not run");
      },
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async () => {
        throw new Error("Auth should not run");
      },
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.httpStatus, 503);
  assert.equal(result.otpCalls, 0);
});

await run("success finalises as completed", async () => {
  const finals = [];
  await runAccountSignInLinkFlow(
    { submissionId: SUBMISSION, email: "member@example.com" },
    {
      user: { id: "u1" },
      supabaseConfigured: true,
      claim: async () => "acquired",
      complete: async (id) => finals.push(["completed", id]),
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async () => ({ error: null }),
    },
  );
  assert.deepEqual(finals, [["completed", SUBMISSION]]);
});

await run("failure finalises as failed", async () => {
  const finals = [];
  const result = await runAccountSignInLinkFlow(
    { submissionId: SUBMISSION, email: "member@example.com" },
    {
      user: { id: "u1" },
      supabaseConfigured: true,
      claim: async () => "acquired",
      complete: async () => {
        throw new Error("complete should not run");
      },
      fail: async (id) => finals.push(["failed", id]),
      signInWithOtp: async () => ({ error: { message: "provider down" } }),
    },
  );
  assert.equal(result.ok, false);
  assert.deepEqual(finals, [["failed", SUBMISSION]]);
});

await run("failed claim is not released", async () => {
  const apiSrc = readFileSync(
    join(REPO_ROOT, "src/pages/api/community/account/sign-in-link.ts"),
    "utf8",
  );
  assert.equal(/releaseOtpSubmission/.test(apiSrc), false);
  assert.match(apiSrc, /runAuthOtpRegisterFlow/);
  assert.match(apiSrc, /account-sign-in-link/);
});

await run("deliberate resend uses a new UUID", async () => {
  const clientSrc = readFileSync(
    join(REPO_ROOT, "src/components/community/CommunityAccountAccess.astro"),
    "utf8",
  );
  assert.match(clientSrc, /nextSubmissionId = createAuthOtpSubmissionId\(\)/);
  assert.match(clientSrc, /Reuse the prepared UUID for this intentional request/);
  assert.match(clientSrc, /AUTH_OTP_RESEND_COOLDOWN_MS/);
});

await run("no automatic retry", async () => {
  const apiSrc = readFileSync(
    join(REPO_ROOT, "src/pages/api/community/account/sign-in-link.ts"),
    "utf8",
  );
  const clientSrc = readFileSync(
    join(REPO_ROOT, "src/components/community/CommunityAccountAccess.astro"),
    "utf8",
  );
  assert.equal(/\bretry\b/i.test(apiSrc), false);
  assert.equal(/\bretry\b/i.test(clientSrc), false);
  assert.equal((apiSrc.match(/auth\.signInWithOtp/g) || []).length, 1);
  assert.match(clientSrc, /AUTH_OTP_SLOW_REQUEST_MESSAGE/);
  assert.match(clientSrc, /if \(submitted\) return/);
});

await run("existing authorisation rules remain enforced", async () => {
  const unauthorized = await runAccountSignInLinkFlow(
    { submissionId: SUBMISSION, email: "member@example.com" },
    {
      user: null,
      supabaseConfigured: true,
      claim: async () => "acquired",
      complete: async () => {},
      fail: async () => {},
      signInWithOtp: async () => {
        throw new Error("Auth should not run");
      },
    },
  );
  assert.equal(unauthorized.httpStatus, 401);
  assert.equal(unauthorized.otpCalls, 0);

  const unconfigured = await runAccountSignInLinkFlow(
    { submissionId: SUBMISSION, email: "member@example.com" },
    {
      user: { id: "u1" },
      supabaseConfigured: false,
      claim: async () => "acquired",
      complete: async () => {},
      fail: async () => {},
      signInWithOtp: async () => {
        throw new Error("Auth should not run");
      },
    },
  );
  assert.equal(unconfigured.httpStatus, 503);

  const apiSrc = readFileSync(
    join(REPO_ROOT, "src/pages/api/community/account/sign-in-link.ts"),
    "utf8",
  );
  const authIdx = apiSrc.indexOf("if (!locals.user)");
  const claimIdx = apiSrc.indexOf("await runAuthOtpRegisterFlow");
  const otpIdx = apiSrc.indexOf("auth.signInWithOtp");
  assert.ok(authIdx >= 0 && claimIdx > authIdx && otpIdx > claimIdx);
});

await run("sensitive values are excluded from logs", async () => {
  const dirty = sanitizeAuthOtpLogFields({
    channel: "pc-auth-otp",
    timestamp: "2026-07-14T00:00:00.000Z",
    submissionId: SUBMISSION,
    invocationId: "inv-1",
    authMode: ACCOUNT_MODE,
    event: "register_accepted",
    claimResult: "acquired",
    providerDurationMs: 10,
    totalDurationMs: 20,
    status: "accepted",
    email: "member@example.com",
    token: "pkce_x",
    emailRedirectTo: "https://example.test/callback",
  });
  assert.equal("email" in dirty, false);
  assert.equal("token" in dirty, false);
  assert.equal("emailRedirectTo" in dirty, false);

  const apiSrc = readFileSync(
    join(REPO_ROOT, "src/pages/api/community/account/sign-in-link.ts"),
    "utf8",
  );
  assert.equal(/console\.(error|info|warn)\(/.test(apiSrc), false);
});

await run("migration accepts account-sign-in-link mode", async () => {
  const migration = readFileSync(
    join(REPO_ROOT, "supabase/migrations/20260714240000_auth_otp_submission_claims.sql"),
    "utf8",
  );
  assert.match(
    migration,
    /auth_mode in \('join', 'sign-in', 'resend', 'account-sign-in-link'\)/,
  );
  assert.match(
    migration,
    /p_auth_mode not in \('join', 'sign-in', 'resend', 'account-sign-in-link'\)/,
  );
});

await run("shared flow sets shouldCreateUser false for account mode", async () => {
  const flowSrc = readFileSync(
    join(REPO_ROOT, "src/lib/community/authOtpRegister.ts"),
    "utf8",
  );
  assert.match(
    flowSrc,
    /shouldCreateUser = authMode === "join" \|\| authMode === "resend"/,
  );
});

console.log("");
console.log(`account sign-in-link tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
