import type { APIRoute } from "astro";
import { json } from "../../../../lib/community/api";
import { runAuthOtpRegisterFlow } from "../../../../lib/community/authOtpRegister";

export const prerender = false;

const GENERIC_SEND_ERROR = "Unable to send a sign-in link right now. Please try again.";
const ACCOUNT_AUTH_MODE = "account-sign-in-link" as const;

async function readSubmissionId(request: Request): Promise<{
  submissionId: string | null;
  headerSubmissionId: string | null;
}> {
  const headerSubmissionId = request.headers.get("x-auth-submission-id")?.trim() ?? null;
  let submissionId: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { submissionId?: unknown };
      if (typeof body.submissionId === "string") {
        submissionId = body.submissionId.trim();
      }
    } catch {
      submissionId = null;
    }
  }

  return { submissionId, headerSubmissionId };
}

export const POST: APIRoute = async ({ locals, url, request }) => {
  if (!locals.user) {
    return json({ ok: false, error: "Please log in first." }, 401);
  }

  if (!locals.supabase) {
    return json({ ok: false, error: "Sign-in is not configured yet." }, 503);
  }

  const email = locals.user.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return json({ ok: false, error: "Unable to send a sign-in link for this account." }, 400);
  }

  const { submissionId, headerSubmissionId } = await readSubmissionId(request);

  const redirectTo = "/community/account/";
  const emailRedirectTo = new URL(
    `/auth/callback/?redirectTo=${encodeURIComponent(redirectTo)}`,
    url,
  ).href;

  const flow = await runAuthOtpRegisterFlow(
    {
      submissionId,
      headerSubmissionId,
      authMode: ACCOUNT_AUTH_MODE,
      email,
      displayName: "",
      emailRedirectTo,
    },
    {
      locals,
      signInWithOtp: async ({
        email: otpEmail,
        emailRedirectTo: redirect,
        shouldCreateUser,
      }) => {
        const result = await locals.supabase!.auth.signInWithOtp({
          email: otpEmail,
          options: {
            emailRedirectTo: redirect,
            shouldCreateUser,
          },
        });
        return { error: result.error };
      },
    },
  );

  if (flow.outcome === "accepted") {
    return json({ ok: true });
  }

  if (flow.reason === "missing_submission") {
    return json({ ok: false, error: GENERIC_SEND_ERROR, reference: flow.invocationId }, 400);
  }

  if (flow.reason === "claim_unavailable") {
    return json({ ok: false, error: GENERIC_SEND_ERROR, reference: flow.invocationId }, 503);
  }

  return json({ ok: false, error: GENERIC_SEND_ERROR, reference: flow.invocationId }, 500);
};
