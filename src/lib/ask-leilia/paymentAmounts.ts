import type { AskLeiliaDbReadingType } from "./readingTypes";

/** Expected Stripe charge amounts in cents (USD). */
export const EXPECTED_PAYMENT_CENTS: Record<AskLeiliaDbReadingType, number> = {
  "one-question": 4500,
  "in-depth": 7500,
  "personal-guidance": 15000,
  complimentary: 0,
};

export function expectedPaymentCents(readingType: AskLeiliaDbReadingType): number {
  return EXPECTED_PAYMENT_CENTS[readingType];
}

export function formatUsdCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function paymentAmountMatches(
  readingType: AskLeiliaDbReadingType,
  amountCents: number,
  currency: string,
): boolean {
  if (currency.toLowerCase() !== "usd") return false;
  return amountCents === expectedPaymentCents(readingType);
}
