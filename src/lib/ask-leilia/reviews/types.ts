import type { AskLeiliaDbReadingType } from "../readingTypes";

export const ASK_LEILIA_REVIEW_MODERATION_STATUSES = [
  "pending",
  "approved",
  "archived",
] as const;

export type AskLeiliaReviewModerationStatus =
  (typeof ASK_LEILIA_REVIEW_MODERATION_STATUSES)[number];

export const ASK_LEILIA_REVIEW_VERIFICATION_STATUSES = [
  "unverified",
  "verified_completed_reading",
  "manually_verified",
] as const;

export type AskLeiliaReviewVerificationStatus =
  (typeof ASK_LEILIA_REVIEW_VERIFICATION_STATUSES)[number];

export type AskLeiliaReviewToken = {
  id: string;
  request_id: string;
  token_hash: string;
  created_at: string;
  consumed_at: string | null;
};

export type AskLeiliaReview = {
  id: string;
  request_id: string | null;
  review_token_id: string | null;
  reviewer_email: string;
  display_name: string;
  reading_type: AskLeiliaDbReadingType;
  rating: number;
  title: string | null;
  body_original: string;
  body_public: string | null;
  consent_publish: boolean;
  consent_marketing: boolean;
  verification_status: AskLeiliaReviewVerificationStatus;
  moderation_status: AskLeiliaReviewModerationStatus;
  is_featured: boolean;
  submitted_at: string;
  approved_at: string | null;
  approved_by: string | null;
  updated_at: string;
};

/** Fields safe to expose in public HTML / crawlers. */
export type AskLeiliaPublicReview = {
  id: string;
  display_name: string;
  reading_type: AskLeiliaDbReadingType;
  reading_type_label: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified: boolean;
  published_month_year: string;
};

export function isAskLeiliaReviewModerationStatus(
  value: unknown,
): value is AskLeiliaReviewModerationStatus {
  return (
    typeof value === "string" &&
    ASK_LEILIA_REVIEW_MODERATION_STATUSES.includes(
      value as AskLeiliaReviewModerationStatus,
    )
  );
}

export function isAskLeiliaReviewVerificationStatus(
  value: unknown,
): value is AskLeiliaReviewVerificationStatus {
  return (
    typeof value === "string" &&
    ASK_LEILIA_REVIEW_VERIFICATION_STATUSES.includes(
      value as AskLeiliaReviewVerificationStatus,
    )
  );
}

export function reviewPublicBody(review: Pick<AskLeiliaReview, "body_original" | "body_public">): string {
  return (review.body_public?.trim() || review.body_original).trim();
}

export function isVerifiedAskLeiliaReview(
  status: AskLeiliaReviewVerificationStatus,
): boolean {
  return status === "verified_completed_reading" || status === "manually_verified";
}
