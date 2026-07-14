import type { SupabaseClient } from "@supabase/supabase-js";
import { siteBase } from "../../site";
import { readingTypeLabel, type AskLeiliaDbReadingType } from "../readingTypes";
import {
  generateAskLeiliaReviewToken,
  hashAskLeiliaReviewToken,
} from "./tokens";
import type {
  AskLeiliaPublicReview,
  AskLeiliaReview,
  AskLeiliaReviewModerationStatus,
  AskLeiliaReviewToken,
  AskLeiliaReviewVerificationStatus,
} from "./types";
import {
  isVerifiedAskLeiliaReview,
  reviewPublicBody,
} from "./types";

function formatMonthYear(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function toPublicReview(row: AskLeiliaReview): AskLeiliaPublicReview {
  const publishedAt = row.approved_at || row.submitted_at;
  return {
    id: row.id,
    display_name: row.display_name,
    reading_type: row.reading_type,
    reading_type_label: readingTypeLabel(row.reading_type),
    rating: row.rating,
    title: row.title,
    body: reviewPublicBody(row),
    is_verified: isVerifiedAskLeiliaReview(row.verification_status),
    published_month_year: formatMonthYear(publishedAt),
  };
}

/**
 * Returns an existing unused token for a delivered request, or creates one.
 * Retries of delivery email reuse the same raw token only when freshly created
 * in this call; if a token already exists, a new raw token is rotated only when
 * unconsumed — otherwise returns null so the email can still send without a link
 * when already consumed (review already submitted).
 *
 * Strategy: create-or-fetch by request_id. Store only hash. Return raw token
 * only immediately after insert. For existing unconsumed tokens we rotate the
 * hash with a new raw token so email retries always have a usable link without
 * enabling unlimited reviews (one review per token_id unique constraint).
 */
export async function ensureAskLeiliaReviewToken(
  service: SupabaseClient,
  requestId: string,
): Promise<{ ok: true; token: string; tokenId: string } | { ok: false; error: string }> {
  const { data: existing, error: fetchError } = await service
    .from("ask_leilia_review_tokens")
    .select("id, request_id, token_hash, created_at, consumed_at")
    .eq("request_id", requestId)
    .maybeSingle();

  if (fetchError) {
    console.error("Unable to load Ask Leilia review token:", fetchError);
    return { ok: false, error: "Unable to prepare a review link." };
  }

  const row = existing as AskLeiliaReviewToken | null;

  if (row?.consumed_at) {
    return { ok: false, error: "Review already submitted for this reading." };
  }

  const rawToken = generateAskLeiliaReviewToken();
  const tokenHash = hashAskLeiliaReviewToken(rawToken);

  if (row) {
    const { error: updateError } = await service
      .from("ask_leilia_review_tokens")
      .update({ token_hash: tokenHash })
      .eq("id", row.id)
      .is("consumed_at", null);

    if (updateError) {
      console.error("Unable to rotate Ask Leilia review token:", updateError);
      return { ok: false, error: "Unable to prepare a review link." };
    }

    return { ok: true, token: rawToken, tokenId: row.id };
  }

  const { data: inserted, error: insertError } = await service
    .from("ask_leilia_review_tokens")
    .insert({
      request_id: requestId,
      token_hash: tokenHash,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Unable to create Ask Leilia review token:", insertError);
    return { ok: false, error: "Unable to prepare a review link." };
  }

  return { ok: true, token: rawToken, tokenId: (inserted as { id: string }).id };
}

export function buildAskLeiliaReviewUrl(
  astroLike: { site?: URL; url: URL },
  token: string,
): string {
  const base = siteBase({ site: astroLike.site, url: astroLike.url }).origin;
  return `${base}/submit-a-review/?token=${encodeURIComponent(token)}`;
}

export async function resolveAskLeiliaReviewToken(
  service: SupabaseClient,
  rawToken: string,
): Promise<
  | {
      ok: true;
      tokenId: string;
      requestId: string;
      email: string;
      name: string;
      readingType: AskLeiliaDbReadingType;
      status: string;
    }
  | { ok: false; reason: "invalid" | "consumed" | "not_delivered" | "error" }
> {
  if (!rawToken || rawToken.length < 20 || rawToken.length > 200) {
    return { ok: false, reason: "invalid" };
  }

  const tokenHash = hashAskLeiliaReviewToken(rawToken);
  const { data: tokenRow, error: tokenError } = await service
    .from("ask_leilia_review_tokens")
    .select("id, request_id, consumed_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError) {
    console.error("Ask Leilia review token lookup failed:", tokenError);
    return { ok: false, reason: "error" };
  }

  if (!tokenRow) {
    return { ok: false, reason: "invalid" };
  }

  const token = tokenRow as { id: string; request_id: string; consumed_at: string | null };
  if (token.consumed_at) {
    return { ok: false, reason: "consumed" };
  }

  const { data: request, error: requestError } = await service
    .from("ask_leilia_requests")
    .select("id, email, name, reading_type, status")
    .eq("id", token.request_id)
    .maybeSingle();

  if (requestError || !request) {
    console.error("Ask Leilia review token request lookup failed:", requestError);
    return { ok: false, reason: "error" };
  }

  const req = request as {
    id: string;
    email: string;
    name: string;
    reading_type: AskLeiliaDbReadingType;
    status: string;
  };

  if (req.status !== "Delivered") {
    return { ok: false, reason: "not_delivered" };
  }

  return {
    ok: true,
    tokenId: token.id,
    requestId: req.id,
    email: req.email,
    name: req.name,
    readingType: req.reading_type,
    status: req.status,
  };
}

export async function insertAskLeiliaReview(
  service: SupabaseClient,
  input: {
    requestId: string | null;
    reviewTokenId: string | null;
    reviewerEmail: string;
    displayName: string;
    readingType: AskLeiliaDbReadingType;
    rating: number;
    title: string;
    body: string;
    consentPublish: boolean;
    consentMarketing: boolean;
    verificationStatus: AskLeiliaReviewVerificationStatus;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const now = new Date().toISOString();

  if (input.reviewTokenId) {
    const { data: claimed, error: claimError } = await service
      .from("ask_leilia_review_tokens")
      .update({ consumed_at: now })
      .eq("id", input.reviewTokenId)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Unable to claim Ask Leilia review token:", claimError);
      return { ok: false, error: "Unable to submit the review right now." };
    }

    if (!claimed) {
      return { ok: false, error: "This review link has already been used." };
    }
  }

  const { data, error } = await service
    .from("ask_leilia_reviews")
    .insert({
      request_id: input.requestId,
      review_token_id: input.reviewTokenId,
      reviewer_email: input.reviewerEmail,
      display_name: input.displayName,
      reading_type: input.readingType,
      rating: input.rating,
      title: input.title || null,
      body_original: input.body,
      body_public: null,
      consent_publish: input.consentPublish,
      consent_marketing: input.consentMarketing,
      verification_status: input.verificationStatus,
      moderation_status: "pending",
      is_featured: false,
      submitted_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Unable to insert Ask Leilia review:", error);
    if (input.reviewTokenId) {
      await service
        .from("ask_leilia_review_tokens")
        .update({ consumed_at: null })
        .eq("id", input.reviewTokenId);
    }
    return { ok: false, error: "Unable to submit the review right now." };
  }

  const reviewId = (data as { id: string }).id;

  if (input.requestId) {
    const { error: linkError } = await service
      .from("ask_leilia_requests")
      .update({
        review_status: "provided",
        linked_review_id: reviewId,
      })
      .eq("id", input.requestId);

    if (linkError) {
      console.error("Unable to link Ask Leilia review to request:", linkError);
    }
  }

  return { ok: true, id: reviewId };
}

export async function listAskLeiliaReviews(
  service: SupabaseClient,
  moderationStatus: AskLeiliaReviewModerationStatus | "all",
): Promise<AskLeiliaReview[]> {
  let query = service
    .from("ask_leilia_reviews")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (moderationStatus !== "all") {
    query = query.eq("moderation_status", moderationStatus);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Unable to list Ask Leilia reviews:", error);
    return [];
  }

  return (data ?? []) as AskLeiliaReview[];
}

export async function getAskLeiliaReviewById(
  service: SupabaseClient,
  id: string,
): Promise<AskLeiliaReview | null> {
  const { data, error } = await service
    .from("ask_leilia_reviews")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load Ask Leilia review:", error);
    return null;
  }

  return (data as AskLeiliaReview | null) ?? null;
}

/** Approved reviews for the Ask Leilia carousel (max 6). Featured first, then newest. */
export async function listPublicAskLeiliaReviews(
  service: SupabaseClient,
  limit = 6,
): Promise<AskLeiliaPublicReview[]> {
  const { data, error } = await service
    .from("ask_leilia_reviews")
    .select(
      "id, display_name, reading_type, rating, title, body_original, body_public, verification_status, approved_at, submitted_at, is_featured, moderation_status",
    )
    .eq("moderation_status", "approved")
    .order("is_featured", { ascending: false })
    .order("approved_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Unable to load public Ask Leilia reviews:", error);
    return [];
  }

  return ((data ?? []) as AskLeiliaReview[]).map(toPublicReview);
}

export async function updateAskLeiliaReviewModeration(
  service: SupabaseClient,
  input: {
    id: string;
    moderationStatus: AskLeiliaReviewModerationStatus;
    approvedBy: string | null;
    isFeatured?: boolean;
    displayName?: string;
    bodyPublic?: string;
    title?: string | null;
    verificationStatus?: AskLeiliaReviewVerificationStatus;
    preserveApprovalTimestamp?: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getAskLeiliaReviewById(service, input.id);
  if (!existing) return { ok: false, error: "Review not found." };

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    moderation_status: input.moderationStatus,
    updated_at: now,
  };

  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.bodyPublic !== undefined) patch.body_public = input.bodyPublic;
  if (input.title !== undefined) patch.title = input.title;
  if (input.verificationStatus !== undefined) {
    patch.verification_status = input.verificationStatus;
  }

  if (input.moderationStatus === "approved") {
    if (existing.moderation_status === "approved" && existing.approved_at) {
      patch.approved_at = existing.approved_at;
      patch.approved_by = existing.approved_by;
    } else {
      patch.approved_at = now;
      patch.approved_by = input.approvedBy;
    }
    if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;
  } else {
    patch.approved_at = null;
    patch.approved_by = null;
    patch.is_featured = false;
  }

  const { error } = await service.from("ask_leilia_reviews").update(patch).eq("id", input.id);
  if (error) {
    console.error("Unable to update Ask Leilia review:", error);
    return { ok: false, error: "Unable to update the review." };
  }

  return { ok: true };
}

export async function setAskLeiliaReviewFeatured(
  service: SupabaseClient,
  id: string,
  isFeatured: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const review = await getAskLeiliaReviewById(service, id);
  if (!review) return { ok: false, error: "Review not found." };
  if (isFeatured && review.moderation_status !== "approved") {
    return { ok: false, error: "Only approved reviews can be featured." };
  }

  const { error } = await service
    .from("ask_leilia_reviews")
    .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Unable to update featured flag:", error);
    return { ok: false, error: "Unable to update the review." };
  }

  return { ok: true };
}
