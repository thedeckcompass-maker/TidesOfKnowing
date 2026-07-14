#!/usr/bin/env node
/**
 * Practice Commons auth OTP claim wiring — focused unit tests.
 * Run: node scripts/auth-otp-register.test.mjs
 *
 * Self-contained (mirrors contracts in src/lib/community/*) so Node can run
 * without resolving Astro extensionless TS imports.
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

function normalizeAuthOtpSubmissionId(submissionId) {
  const id = typeof submissionId === "string" ? submissionId.trim() : "";
  if (!id || !UUID_RE.test(id)) return null;
  return id.toLowerCase();
}

function normalizeAuthOtpClaimMode(authMode) {
  if (authMode === "sign-in") return "sign-in";
  if (authMode === "resend") return "resend";
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

async function runAuthOtpRegisterFlow(input, deps) {
  const logs = [];
  const log = deps.log ?? ((fields) => logs.push(sanitizeAuthOtpLogFields(fields)));
  const now = deps.now ?? Date.now;
  const invocationId = (deps.createInvocationId ?? (() => "inv-test"))();
  const startedAt = now();
  const authMode = normalizeAuthOtpClaimMode(input.authMode);
  const normalizedSubmissionId =
    normalizeAuthOtpSubmissionId(input.submissionId) ??
    normalizeAuthOtpSubmissionId(input.headerSubmissionId);

  log({
    submissionId: normalizedSubmissionId,
    invocationId,
    authMode,
    event: "register_received",
    status: "received",
  });

  if (!normalizedSubmissionId) {
    return { outcome: "rejected", reason: "missing_submission", invocationId, logs };
  }

  const claimResult = await deps.claim(normalizedSubmissionId, authMode);
  if (claimResult === "duplicate") {
    return { outcome: "accepted", reason: "duplicate_claim", invocationId, logs };
  }
  if (claimResult !== "acquired") {
    return { outcome: "rejected", reason: "claim_unavailable", invocationId, logs };
  }

  let signInError = null;
  try {
    const result = await deps.signInWithOtp({
      email: input.email,
      emailRedirectTo: input.emailRedirectTo,
      shouldCreateUser: authMode !== "sign-in",
      displayName: authMode !== "sign-in" ? input.displayName : undefined,
    });
    signInError = result.error;
  } catch (caught) {
    signInError = caught;
  }

  if (signInError) {
    await deps.fail(normalizedSubmissionId);
    return { outcome: "rejected", reason: "provider_error", invocationId, logs };
  }

  await deps.complete(normalizedSubmissionId);
  return { outcome: "accepted", reason: "provider_success", invocationId, logs };
}

const SUBMISSION = "815686d0-e4a5-4c14-82cc-26159b2e7c92";

await run("first UUID claim calls signInWithOtp once", async () => {
  let otpCalls = 0;
  let completeCalls = 0;
  const result = await runAuthOtpRegisterFlow(
    {
      submissionId: SUBMISSION,
      authMode: "join",
      email: "reader@example.com",
      displayName: "Reader",
      emailRedirectTo: "https://example.test/callback",
    },
    {
      claim: async () => "acquired",
      complete: async () => {
        completeCalls += 1;
      },
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async () => {
        otpCalls += 1;
        return { error: null };
      },
    },
  );
  assert.equal(result.outcome, "accepted");
  assert.equal(otpCalls, 1);
  assert.equal(completeCalls, 1);
});

await run("duplicate UUID never calls signInWithOtp", async () => {
  let otpCalls = 0;
  const result = await runAuthOtpRegisterFlow(
    {
      submissionId: SUBMISSION,
      authMode: "sign-in",
      email: "reader@example.com",
      displayName: "",
      emailRedirectTo: "https://example.test/callback",
    },
    {
      claim: async () => "duplicate",
      complete: async () => {
        throw new Error("complete should not run");
      },
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async () => {
        otpCalls += 1;
        return { error: null };
      },
    },
  );
  assert.equal(result.outcome, "accepted");
  assert.equal(result.reason, "duplicate_claim");
  assert.equal(otpCalls, 0);
});

await run("missing or malformed UUID never calls signInWithOtp", async () => {
  for (const submissionId of [null, "", "not-a-uuid", "pc-123"]) {
    let otpCalls = 0;
    let claimCalls = 0;
    const result = await runAuthOtpRegisterFlow(
      {
        submissionId,
        authMode: "join",
        email: "reader@example.com",
        displayName: "Reader",
        emailRedirectTo: "https://example.test/callback",
      },
      {
        claim: async () => {
          claimCalls += 1;
          return "acquired";
        },
        complete: async () => {},
        fail: async () => {},
        signInWithOtp: async () => {
          otpCalls += 1;
          return { error: null };
        },
      },
    );
    assert.equal(result.outcome, "rejected");
    assert.equal(result.reason, "missing_submission");
    assert.equal(otpCalls, 0);
    assert.equal(claimCalls, 0);
  }
});

await run("unavailable claim service fails closed", async () => {
  let otpCalls = 0;
  const result = await runAuthOtpRegisterFlow(
    {
      submissionId: SUBMISSION,
      authMode: "resend",
      email: "reader@example.com",
      displayName: "Reader",
      emailRedirectTo: "https://example.test/callback",
    },
    {
      claim: async () => "unavailable",
      complete: async () => {
        throw new Error("complete should not run");
      },
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async () => {
        otpCalls += 1;
        return { error: null };
      },
    },
  );
  assert.equal(result.outcome, "rejected");
  assert.equal(result.reason, "claim_unavailable");
  assert.equal(otpCalls, 0);
});

await run("provider success finalises as completed", async () => {
  const finals = [];
  await runAuthOtpRegisterFlow(
    {
      submissionId: SUBMISSION,
      authMode: "join",
      email: "reader@example.com",
      displayName: "Reader",
      emailRedirectTo: "https://example.test/callback",
    },
    {
      claim: async () => "acquired",
      complete: async (id) => {
        finals.push(["completed", id]);
      },
      fail: async () => {
        throw new Error("fail should not run");
      },
      signInWithOtp: async () => ({ error: null }),
    },
  );
  assert.deepEqual(finals, [["completed", SUBMISSION]]);
});

await run("provider failure finalises as failed", async () => {
  const finals = [];
  const result = await runAuthOtpRegisterFlow(
    {
      submissionId: SUBMISSION,
      authMode: "join",
      email: "reader@example.com",
      displayName: "Reader",
      emailRedirectTo: "https://example.test/callback",
    },
    {
      claim: async () => "acquired",
      complete: async () => {
        throw new Error("complete should not run");
      },
      fail: async (id) => {
        finals.push(["failed", id]);
      },
      signInWithOtp: async () => ({ error: { message: "provider down" } }),
    },
  );
  assert.equal(result.outcome, "rejected");
  assert.equal(result.reason, "provider_error");
  assert.deepEqual(finals, [["failed", SUBMISSION]]);
});

await run("failed claim is not released", async () => {
  const registerSrc = readFileSync(
    join(REPO_ROOT, "src/lib/community/authOtpRegister.ts"),
    "utf8",
  );
  const otpSrc = readFileSync(join(REPO_ROOT, "src/lib/community/otpIdempotency.ts"), "utf8");
  assert.equal(/releaseOtpSubmission/.test(registerSrc), false);
  assert.equal(/releaseOtpSubmission/.test(otpSrc), false);
  assert.match(otpSrc, /failOtpSubmission/);
  assert.match(otpSrc, /Mark provider failure without deleting/);
  assert.equal(/\.delete\(/.test(otpSrc), false);
});

await run("deliberate resend uses a new UUID", async () => {
  const formSrc = readFileSync(join(REPO_ROOT, "src/lib/community/authRegisterForm.ts"), "utf8");
  assert.match(formSrc, /rotateAuthOtpSubmissionField/);
  assert.match(formSrc, /Issue a new UUID for a deliberate later attempt/);
  assert.match(formSrc, /resendCooldownMs/);
  const checkEmail = readFileSync(join(REPO_ROOT, "src/pages/auth/check-email.astro"), "utf8");
  assert.match(checkEmail, /name="submissionId"/);
  assert.match(checkEmail, /authMode" value="resend"/);
});

await run("no-JavaScript forms contain a valid UUID", async () => {
  const files = [
    "src/pages/auth/register.astro",
    "src/pages/community/index.astro",
    "src/pages/auth/check-email.astro",
  ];
  for (const relative of files) {
    const src = readFileSync(join(REPO_ROOT, relative), "utf8");
    assert.match(src, /name="submissionId"/, relative);
    assert.match(
      src,
      /name="submissionId" value=\{(joinSubmissionId|signInSubmissionId|resendSubmissionId)\}/,
      relative,
    );
  }
  assert.match(
    readFileSync(join(REPO_ROOT, "src/pages/community/index.astro"), "utf8"),
    /joinSubmissionId[\s\S]*signInSubmissionId/,
  );
});

await run("JavaScript reuses the existing UUID", async () => {
  const formSrc = readFileSync(join(REPO_ROOT, "src/lib/community/authRegisterForm.ts"), "utf8");
  assert.match(formSrc, /readAuthOtpSubmissionIdForRequest/);
  assert.match(formSrc, /Reuse the form’s existing UUID for this request/);
  assert.equal(/const correlationId = createSubmissionId\(/.test(formSrc), false);
  assert.match(formSrc, /formData\.set\("submissionId", correlationId\)/);
});

await run("loading copy stays calm until success or clear error", async () => {
  const formSrc = readFileSync(join(REPO_ROOT, "src/lib/community/authRegisterForm.ts"), "utf8");
  assert.match(formSrc, /AUTH_OTP_SENDING_STATUS_MESSAGE/);
  assert.match(formSrc, /Please wait while we prepare your secure sign-in link\./);
  assert.match(formSrc, /AUTH_OTP_SENDING_BUTTON_TEXT = "Sending sign-in link\.\.\."/);
  assert.match(formSrc, /AUTH_OTP_ERROR_MESSAGE/);
  assert.equal(/taking longer than expected/i.test(formSrc), false);
  assert.equal(/AUTH_OTP_SLOW_THRESHOLD_MS/.test(formSrc), false);
  assert.equal(/setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*taking longer/.test(formSrc), false);
  assert.equal(/slowThresholdMs/.test(formSrc), false);
});

await run("sensitive values are excluded from logs", async () => {
  const dirty = sanitizeAuthOtpLogFields({
    channel: "pc-auth-otp",
    timestamp: "2026-07-14T00:00:00.000Z",
    submissionId: SUBMISSION,
    invocationId: "inv-1",
    authMode: "join",
    event: "register_accepted",
    claimResult: "acquired",
    providerDurationMs: 120,
    totalDurationMs: 200,
    status: "accepted",
    email: "secret@example.com",
    emailDomain: "example.com",
    token: "pkce_abc",
    emailRedirectTo: "https://example.test/callback",
    cookie: "sb-access",
    body: { email: "x" },
    errorMessage: "supabase boom",
  });
  assert.deepEqual(Object.keys(dirty).sort(), [
    "authMode",
    "channel",
    "claimResult",
    "event",
    "invocationId",
    "providerDurationMs",
    "status",
    "submissionId",
    "timestamp",
    "totalDurationMs",
  ]);
  assert.equal("email" in dirty, false);
  assert.equal("token" in dirty, false);
  assert.equal("emailRedirectTo" in dirty, false);

  const logSrc = readFileSync(join(REPO_ROOT, "src/lib/community/authOtpLog.ts"), "utf8");
  const flowSrc = readFileSync(join(REPO_ROOT, "src/lib/community/authOtpRegister.ts"), "utf8");
  assert.match(logSrc, /never email, tokens, URLs, bodies/i);
  assert.equal(/emailDomain/.test(flowSrc), false);
  assert.equal(/console\.(info|error|warn)\([^)]*email/i.test(flowSrc), false);
});

await run("source flow claims before OTP and only on acquired", async () => {
  const flowSrc = readFileSync(join(REPO_ROOT, "src/lib/community/authOtpRegister.ts"), "utf8");
  const claimIdx = flowSrc.indexOf("claimFn(");
  const otpIdx = flowSrc.indexOf("deps.signInWithOtp");
  assert.ok(claimIdx > 0 && otpIdx > claimIdx, "claim must precede signInWithOtp");
  assert.match(flowSrc, /claimResult !== "acquired"/);
  assert.match(flowSrc, /claimResult === "duplicate"/);
});

await run("no automatic retry occurs", async () => {
  const registerSrc = readFileSync(
    join(REPO_ROOT, "src/lib/community/authOtpRegister.ts"),
    "utf8",
  );
  const formSrc = readFileSync(join(REPO_ROOT, "src/lib/community/authRegisterForm.ts"), "utf8");
  assert.equal(/signInWithOtp[\s\S]{0,80}signInWithOtp/.test(registerSrc.replace(/\n/g, " ")), false);
  assert.equal(/\bretry\b/i.test(formSrc), false);
  assert.match(formSrc, /if \(submitted\) \{/);
  assert.equal(/taking longer than expected/i.test(formSrc), false);
});

console.log("");
console.log(`auth otp register tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
