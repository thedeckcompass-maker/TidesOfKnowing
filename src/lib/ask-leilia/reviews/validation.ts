import { cleanText, type ValidationResult } from "../validation";
import {
  isAskLeiliaDbReadingType,
  isAskLeiliaReadingType,
  type AskLeiliaDbReadingType,
} from "../readingTypes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_BODY = 40;
const MAX_BODY = 4000;
const MAX_TITLE = 120;
const MAX_NAME = 80;

export type AskLeiliaReviewSubmission = {
  displayName: string;
  email: string;
  readingType: AskLeiliaDbReadingType;
  rating: number;
  title: string;
  body: string;
  consentPublish: boolean;
  consentMarketing: boolean;
  token: string;
};

export function stripUnsafeReviewText(value: string): string {
  return value
    .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\u0000/g, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function validateAskLeiliaReviewSubmission(input: {
  displayName: unknown;
  email: unknown;
  readingType: unknown;
  rating: unknown;
  title: unknown;
  body: unknown;
  consentPublish: unknown;
  consentMarketing: unknown;
  token: unknown;
  honeypot: unknown;
}): ValidationResult<AskLeiliaReviewSubmission> {
  const honeypot = cleanText(input.honeypot);
  if (honeypot) {
    return { ok: false, error: "Unable to submit the review right now. Please try again later." };
  }

  const displayName = stripUnsafeReviewText(cleanText(input.displayName).replace(/\s+/g, " "));
  const email = cleanText(input.email).toLowerCase();
  const title = stripUnsafeReviewText(cleanText(input.title).replace(/\s+/g, " "));
  const body = stripUnsafeReviewText(cleanText(input.body));
  const token = typeof input.token === "string" ? input.token.trim() : "";

  const ratingRaw =
    typeof input.rating === "number"
      ? input.rating
      : typeof input.rating === "string"
        ? Number.parseInt(input.rating, 10)
        : NaN;

  const consentPublish =
    input.consentPublish === true ||
    input.consentPublish === "on" ||
    input.consentPublish === "true" ||
    input.consentPublish === "1";

  const consentMarketing =
    input.consentMarketing === true ||
    input.consentMarketing === "on" ||
    input.consentMarketing === "true" ||
    input.consentMarketing === "1";

  if (!displayName || displayName.length < 1 || displayName.length > MAX_NAME) {
    return {
      ok: false,
      error: "Please enter a public display name (up to 80 characters).",
    };
  }

  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    if (!token) {
      return { ok: false, error: "Please enter a valid email address." };
    }
  }

  // Untokened public form: only the three current Ask Leilia products.
  // Tokened path: accept stored DB types (including historical complimentary);
  // the API still overrides reading type from the linked request.
  if (token) {
    if (!isAskLeiliaDbReadingType(input.readingType)) {
      return { ok: false, error: "Please choose a reading type." };
    }
  } else if (!isAskLeiliaReadingType(input.readingType)) {
    return { ok: false, error: "Please choose a reading type." };
  }

  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { ok: false, error: "Please choose a rating from 1 to 5." };
  }

  if (title.length > MAX_TITLE) {
    return { ok: false, error: "The review heading must be 120 characters or fewer." };
  }

  if (body.length < MIN_BODY) {
    return {
      ok: false,
      error: `Please write a little more about your experience (at least ${MIN_BODY} characters).`,
    };
  }

  if (body.length > MAX_BODY) {
    return {
      ok: false,
      error: `Please keep your review to ${MAX_BODY} characters or fewer.`,
    };
  }

  if (!consentPublish) {
    return {
      ok: false,
      error:
        "Please confirm that you give permission for this review to be published on the Tides of Knowing website.",
    };
  }

  return {
    ok: true,
    value: {
      displayName,
      email,
      readingType: input.readingType,
      rating: ratingRaw,
      title,
      body,
      consentPublish: true,
      consentMarketing,
      token,
    },
  };
}

export function validateAskLeiliaReviewAdminEdit(input: {
  displayName: unknown;
  bodyPublic: unknown;
  title: unknown;
}): ValidationResult<{ displayName: string; bodyPublic: string; title: string }> {
  const displayName = stripUnsafeReviewText(cleanText(input.displayName).replace(/\s+/g, " "));
  const bodyPublic = stripUnsafeReviewText(cleanText(input.bodyPublic));
  const title = stripUnsafeReviewText(cleanText(input.title).replace(/\s+/g, " "));

  if (!displayName || displayName.length > MAX_NAME) {
    return { ok: false, error: "Public display name must be between 1 and 80 characters." };
  }

  if (title.length > MAX_TITLE) {
    return { ok: false, error: "Review heading must be 120 characters or fewer." };
  }

  if (bodyPublic.length < MIN_BODY || bodyPublic.length > MAX_BODY) {
    return {
      ok: false,
      error: `Public review text must be between ${MIN_BODY} and ${MAX_BODY} characters.`,
    };
  }

  return { ok: true, value: { displayName, bodyPublic, title } };
}
