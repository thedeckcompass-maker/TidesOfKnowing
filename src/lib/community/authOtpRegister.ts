/**
 * Practice Commons register OTP send gated by atomic submission claims.
 * Email and redirect URLs are used for the Auth call only and are never logged here.
 */

import type { AuthOtpClaimMode, AuthOtpClaimResult } from "./otpIdempotency";
import {
  claimOtpSubmission,
  completeOtpSubmission,
  failOtpSubmission,
  normalizeAuthOtpClaimMode,
  normalizeAuthOtpSubmissionId,
} from "./otpIdempotency";
import { logAuthOtpEvent } from "./authOtpLog";

export type AuthOtpSignInWithOtp = (args: {
  email: string;
  emailRedirectTo: string;
  shouldCreateUser: boolean;
  displayName?: string;
}) => Promise<{ error: unknown }>;

export type AuthOtpRegisterFlowDeps = {
  claim?: typeof claimOtpSubmission;
  complete?: typeof completeOtpSubmission;
  fail?: typeof failOtpSubmission;
  signInWithOtp: AuthOtpSignInWithOtp;
  isExpectedReturningMemberPrivacyError?: (error: unknown) => boolean;
  log?: typeof logAuthOtpEvent;
  now?: () => number;
  createInvocationId?: () => string;
  locals?: unknown;
};

export type AuthOtpRegisterFlowInput = {
  submissionId: string | null | undefined;
  headerSubmissionId?: string | null | undefined;
  authMode: string | null | undefined;
  email: string;
  displayName: string;
  emailRedirectTo: string;
};

export type AuthOtpRegisterFlowResult =
  | { outcome: "accepted"; reason: "provider_success" | "duplicate_claim" | "privacy_accepted" }
  | {
      outcome: "rejected";
      reason: "missing_submission" | "claim_unavailable" | "provider_error";
      invocationId: string;
    };

function resolveSubmissionId(
  submissionId: string | null | undefined,
  headerSubmissionId?: string | null | undefined,
): string | null {
  return (
    normalizeAuthOtpSubmissionId(submissionId) ??
    normalizeAuthOtpSubmissionId(headerSubmissionId)
  );
}

/**
 * Claim before OTP. Calls signInWithOtp only when claim is acquired.
 * Duplicate → accepted without Auth. Unavailable / invalid → fail closed.
 */
export async function runAuthOtpRegisterFlow(
  input: AuthOtpRegisterFlowInput,
  deps: AuthOtpRegisterFlowDeps,
): Promise<AuthOtpRegisterFlowResult> {
  const claimFn = deps.claim ?? claimOtpSubmission;
  const completeFn = deps.complete ?? completeOtpSubmission;
  const failFn = deps.fail ?? failOtpSubmission;
  const log = deps.log ?? logAuthOtpEvent;
  const now = deps.now ?? Date.now;
  const invocationId = (deps.createInvocationId ?? (() => crypto.randomUUID()))();
  const startedAt = now();
  const authMode: AuthOtpClaimMode = normalizeAuthOtpClaimMode(input.authMode);
  const normalizedSubmissionId = resolveSubmissionId(
    input.submissionId,
    input.headerSubmissionId,
  );

  log({
    submissionId: normalizedSubmissionId,
    invocationId,
    authMode,
    event: "register_received",
    status: "received",
  });

  if (!normalizedSubmissionId) {
    log({
      submissionId: null,
      invocationId,
      authMode,
      event: "register_rejected",
      status: "rejected_missing_submission",
      totalDurationMs: now() - startedAt,
    });
    return { outcome: "rejected", reason: "missing_submission", invocationId };
  }

  const claimResult: AuthOtpClaimResult = await claimFn(
    normalizedSubmissionId,
    authMode,
    deps.locals,
  );

  if (claimResult === "duplicate") {
    log({
      submissionId: normalizedSubmissionId,
      invocationId,
      authMode,
      event: "register_duplicate",
      claimResult,
      status: "claim_duplicate",
      totalDurationMs: now() - startedAt,
    });
    return { outcome: "accepted", reason: "duplicate_claim" };
  }

  if (claimResult !== "acquired") {
    log({
      submissionId: normalizedSubmissionId,
      invocationId,
      authMode,
      event: "register_claim_unavailable",
      claimResult,
      status: "claim_unavailable",
      totalDurationMs: now() - startedAt,
    });
    return { outcome: "rejected", reason: "claim_unavailable", invocationId };
  }

  log({
    submissionId: normalizedSubmissionId,
    invocationId,
    authMode,
    event: "provider_started",
    claimResult: "acquired",
    status: "provider_started",
  });

  const isReturningMemberSignIn = authMode === "sign-in";
  const shouldCreateUser = authMode === "join" || authMode === "resend";
  const attachDisplayName =
    (authMode === "join" || authMode === "resend") && Boolean(input.displayName);

  let signInError: unknown = null;
  const providerStartedAt = now();
  try {
    const result = await deps.signInWithOtp({
      email: input.email,
      emailRedirectTo: input.emailRedirectTo,
      shouldCreateUser,
      displayName: attachDisplayName ? input.displayName : undefined,
    });
    signInError = result.error;
  } catch (caught) {
    signInError = caught;
  }
  const providerDurationMs = now() - providerStartedAt;

  if (
    signInError &&
    isReturningMemberSignIn &&
    deps.isExpectedReturningMemberPrivacyError?.(signInError)
  ) {
    await completeFn(normalizedSubmissionId, deps.locals);
    log({
      submissionId: normalizedSubmissionId,
      invocationId,
      authMode,
      event: "register_accepted",
      claimResult: "acquired",
      providerDurationMs,
      totalDurationMs: now() - startedAt,
      status: "accepted",
    });
    return { outcome: "accepted", reason: "privacy_accepted" };
  }

  if (signInError) {
    await failFn(normalizedSubmissionId, deps.locals);
    log({
      submissionId: normalizedSubmissionId,
      invocationId,
      authMode,
      event: "register_provider_failed",
      claimResult: "acquired",
      providerDurationMs,
      totalDurationMs: now() - startedAt,
      status: "provider_failed",
    });
    return { outcome: "rejected", reason: "provider_error", invocationId };
  }

  await completeFn(normalizedSubmissionId, deps.locals);
  log({
    submissionId: normalizedSubmissionId,
    invocationId,
    authMode,
    event: "register_accepted",
    claimResult: "acquired",
    providerDurationMs,
    totalDurationMs: now() - startedAt,
    status: "accepted",
  });
  return { outcome: "accepted", reason: "provider_success" };
}
