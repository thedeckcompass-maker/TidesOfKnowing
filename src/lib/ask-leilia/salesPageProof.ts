import type { AskLeiliaPublicReview } from "./reviews/types";
import { ASK_LEILIA_PROOF_REVIEW_IDS } from "../../data/askLeilia";

/** Prefer known specific seed reviews; otherwise choose the two most specific bodies. */
export function selectAskLeiliaProofReviews(
  reviews: AskLeiliaPublicReview[],
  limit = 2,
): AskLeiliaPublicReview[] {
  if (reviews.length === 0) return [];

  const byId = new Map(reviews.map((review) => [review.id, review]));
  const preferred = ASK_LEILIA_PROOF_REVIEW_IDS.map((id) => byId.get(id)).filter(
    (review): review is AskLeiliaPublicReview => Boolean(review),
  );
  if (preferred.length >= limit) return preferred.slice(0, limit);

  const remaining = reviews
    .filter((review) => !preferred.some((picked) => picked.id === review.id))
    .sort((a, b) => scoreProofReview(b) - scoreProofReview(a));

  return [...preferred, ...remaining].slice(0, limit);
}

function scoreProofReview(review: AskLeiliaPublicReview): number {
  const body = review.body.toLowerCase();
  let score = Math.min(review.body.length, 280);
  if (/clear|clarity|useful|insight|understand|explained|bias|cards/.test(body)) score += 40;
  if (/amazing|highly recommend|wonderful|perfect/.test(body)) score -= 30;
  if (review.is_verified) score += 10;
  return score;
}

/** Compact excerpt of roughly one to two sentences for the upper proof section. */
export function excerptAskLeiliaReview(body: string, maxChars = 220): string {
  const cleaned = body.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) return cleaned;

  const sentenceMatch = cleaned.match(/^(.+?[.!?])(?:\s+|$)/);
  if (sentenceMatch && sentenceMatch[1].length >= 80 && sentenceMatch[1].length <= maxChars) {
    return sentenceMatch[1];
  }

  const twoSentences = cleaned.match(/^(.+?[.!?]\s+.+?[.!?])/);
  if (twoSentences && twoSentences[1].length <= maxChars) {
    return twoSentences[1];
  }

  const cut = cleaned.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
