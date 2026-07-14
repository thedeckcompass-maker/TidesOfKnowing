/**
 * Atomic Practice Commons OTP submission claims (Postgres).
 *
 * Suppresses duplicate /auth/register handler work that shares the same
 * client submission_id (infrastructure retries). Does not store email
 * addresses and does not replace Supabase Auth rate limits.
 *
 * Failed claims are retained until expiry. Deliberate resends must use a
 * new submission UUID after the client cooldown.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logAuthOtpEvent } from "./authOtpLog";
import {
  createAuthOtpSubmissionId,
  normalizeAuthOtpSubmissionId,
} from "./authOtpSubmissionId";
import { createCommunityServiceClient } from "./supabaseServer";

export type AuthOtpClaimMode = "join" | "sign-in" | "resend" | "account-sign-in-link";
export type AuthOtpClaimResult = "acquired" | "duplicate" | "unavailable";

export { createAuthOtpSubmissionId, normalizeAuthOtpSubmissionId };

export function normalizeAuthOtpClaimMode(authMode: string | null | undefined): AuthOtpClaimMode {
  if (authMode === "sign-in") return "sign-in";
  if (authMode === "resend") return "resend";
  if (authMode === "account-sign-in-link") return "account-sign-in-link";
  return "join";
}

function getServiceClient(locals?: unknown): SupabaseClient | null {
  try {
    return createCommunityServiceClient(locals);
  } catch {
    return null;
  }
}

/**
 * Atomically claims a submission id via security-definer RPC.
 * Concurrent claims for the same id return "duplicate".
 * Callers must not invoke signInWithOtp unless this returns "acquired".
 */
export async function claimOtpSubmission(
  submissionId: string | null | undefined,
  authMode: string | null | undefined,
  locals?: unknown,
): Promise<AuthOtpClaimResult> {
  const id = normalizeAuthOtpSubmissionId(submissionId);
  if (!id) return "unavailable";

  const service = getServiceClient(locals);
  if (!service) {
    logAuthOtpEvent({
      submissionId: id,
      invocationId: "claim-helper",
      authMode: normalizeAuthOtpClaimMode(authMode),
      event: "claim_service_unconfigured",
      claimResult: "unavailable",
      status: "claim_unavailable",
    });
    return "unavailable";
  }

  const mode = normalizeAuthOtpClaimMode(authMode);
  const { data, error } = await service.rpc("claim_auth_otp_submission", {
    p_submission_id: id,
    p_auth_mode: mode,
  });

  if (error) {
    logAuthOtpEvent({
      submissionId: id,
      invocationId: "claim-helper",
      authMode: mode,
      event: "claim_rpc_error",
      claimResult: "unavailable",
      status: "claim_unavailable",
    });
    return "unavailable";
  }

  if (data === "acquired" || data === "duplicate") return data;

  logAuthOtpEvent({
    submissionId: id,
    invocationId: "claim-helper",
    authMode: mode,
    event: "claim_unexpected_result",
    claimResult: "unavailable",
    status: "claim_unavailable",
  });
  return "unavailable";
}

export async function completeOtpSubmission(
  submissionId: string | null | undefined,
  locals?: unknown,
): Promise<void> {
  await finalizeOtpSubmission(submissionId, "completed", locals);
}

/** Mark provider failure without deleting the claim (retained until expiry). */
export async function failOtpSubmission(
  submissionId: string | null | undefined,
  locals?: unknown,
): Promise<void> {
  await finalizeOtpSubmission(submissionId, "failed", locals);
}

async function finalizeOtpSubmission(
  submissionId: string | null | undefined,
  status: "completed" | "failed",
  locals?: unknown,
): Promise<void> {
  const id = normalizeAuthOtpSubmissionId(submissionId);
  if (!id) return;

  const service = getServiceClient(locals);
  if (!service) return;

  const { error } = await service.rpc("finalize_auth_otp_submission", {
    p_submission_id: id,
    p_status: status,
  });

  if (error) {
    logAuthOtpEvent({
      submissionId: id,
      invocationId: "finalize-helper",
      authMode: "join",
      event: "finalize_rpc_error",
      status: status === "completed" ? "accepted" : "failed",
    });
  }
}
