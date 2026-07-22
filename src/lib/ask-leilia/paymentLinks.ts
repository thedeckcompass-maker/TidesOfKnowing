import type { AskLeiliaReadingType } from "./readingTypes";

/** Canonical production Stripe webhook URL (must use www — apex redirects with HTTP 301). */
export const ASK_LEILIA_STRIPE_WEBHOOK_URL =
  "https://www.tidesofknowing.com/api/ask-leilia/stripe-webhook";

export const ONE_QUESTION_PAYMENT_LINK =
  "https://buy.stripe.com/5kQ28qb62fVE8ea8b17N607";

export const IN_DEPTH_PAYMENT_LINK =
  "https://buy.stripe.com/5kQ8wO2zw6l451YgHx7N605";

export const PERSONAL_GUIDANCE_PAYMENT_LINK =
  "https://buy.stripe.com/eVq9AS3DA38S66262T7N606";

const PAYMENT_LINK_BY_READING_TYPE: Record<AskLeiliaReadingType, string> = {
  "one-question": ONE_QUESTION_PAYMENT_LINK,
  "in-depth": IN_DEPTH_PAYMENT_LINK,
  "personal-guidance": PERSONAL_GUIDANCE_PAYMENT_LINK,
};

export function paymentLinkForReadingType(readingType: AskLeiliaReadingType): string {
  return PAYMENT_LINK_BY_READING_TYPE[readingType];
}

export function buildPaymentLinkRedirectUrl(
  paymentLink: string,
  requestId: string,
  email: string,
): string {
  const url = new URL(paymentLink);
  url.searchParams.set("client_reference_id", requestId);
  url.searchParams.set("prefilled_email", email);
  return url.href;
}
