import type { APIRoute } from "astro";
import { json } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import {
  insertAskLeiliaReview,
  resolveAskLeiliaReviewToken,
} from "../../../../lib/ask-leilia/reviews/queries";
import {
  clientIpFromRequest,
  consumeRateLimit,
} from "../../../../lib/ask-leilia/reviews/rateLimit";
import { validateAskLeiliaReviewSubmission } from "../../../../lib/ask-leilia/reviews/validation";
import { isAskLeiliaDbReadingType } from "../../../../lib/ask-leilia/readingTypes";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const ip = clientIpFromRequest(request);
  const rate = consumeRateLimit({
    key: `ask-leilia-review:${ip}`,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.allowed) {
    return json(
      { ok: false, error: "Too many review submissions. Please try again later." },
      429,
    );
  }

  const form = await request.formData();
  const validated = validateAskLeiliaReviewSubmission({
    displayName: form.get("displayName"),
    email: form.get("email"),
    readingType: form.get("readingType"),
    rating: form.get("rating"),
    title: form.get("title"),
    body: form.get("body"),
    consentPublish: form.get("consentPublish"),
    consentMarketing: form.get("consentMarketing"),
    token: form.get("token"),
    honeypot: form.get("website"),
  });

  if (!validated.ok) {
    const tokenParam = typeof form.get("token") === "string" ? String(form.get("token")).trim() : "";
    const params = new URLSearchParams({ error: validated.error });
    if (tokenParam) params.set("token", tokenParam);
    return redirect(`/submit-a-review/?${params.toString()}`, 303);
  }

  const submission = validated.value;
  let requestId: string | null = null;
  let reviewTokenId: string | null = null;
  let verificationStatus: "unverified" | "verified_completed_reading" = "unverified";
  let readingType = submission.readingType;
  let email = submission.email;

  try {
    const service = createCommunityServiceClient(locals);

    if (submission.token) {
      const resolved = await resolveAskLeiliaReviewToken(service, submission.token);

      if (!resolved.ok) {
        // Do not reveal whether token/email/request exists beyond a generic message.
        return redirect(
          `/submit-a-review/?error=${encodeURIComponent("This review link is not available. You can still submit a review without a link.")}`,
          303,
        );
      }

      requestId = resolved.requestId;
      reviewTokenId = resolved.tokenId;
      verificationStatus = "verified_completed_reading";
      readingType = resolved.readingType;
      email = resolved.email.toLowerCase();
    } else {
      if (!submission.email) {
        return redirect(
          `/submit-a-review/?error=${encodeURIComponent("Please enter a valid email address.")}`,
          303,
        );
      }
      if (!isAskLeiliaDbReadingType(submission.readingType)) {
        return redirect(
          `/submit-a-review/?error=${encodeURIComponent("Please choose a reading type.")}`,
          303,
        );
      }
    }

    const inserted = await insertAskLeiliaReview(service, {
      requestId,
      reviewTokenId,
      reviewerEmail: email,
      displayName: submission.displayName,
      readingType,
      rating: submission.rating,
      title: submission.title,
      body: submission.body,
      consentPublish: submission.consentPublish,
      consentMarketing: submission.consentMarketing,
      verificationStatus,
    });

    if (!inserted.ok) {
      const params = new URLSearchParams({ error: inserted.error });
      if (submission.token) params.set("token", submission.token);
      return redirect(`/submit-a-review/?${params.toString()}`, 303);
    }
  } catch (error) {
    console.error("Ask Leilia review submission failed:", error);
    return redirect(
      `/submit-a-review/?error=${encodeURIComponent("Unable to submit the review right now.")}`,
      303,
    );
  }

  return redirect("/submit-a-review/thank-you/", 303);
};
