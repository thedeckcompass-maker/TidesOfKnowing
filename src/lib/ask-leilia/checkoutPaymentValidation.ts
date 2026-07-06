import type Stripe from "stripe";
import { expectedPaymentCents } from "./paymentAmounts";
import type { AskLeiliaDbReadingType } from "./readingTypes";

export type CheckoutPaymentValidationPath = "normal" | "fully_discounted" | "payment_exception";

export type CheckoutPaymentAudit = {
  catalogueAmountCents: number;
  paidAmountCents: number;
  discountAmountCents: number;
  amountSubtotalCents: number | null;
  promotionCodeId: string | null;
  couponId: string | null;
};

export type CheckoutPaymentValidationResult =
  | { accepted: true; path: "normal"; audit: CheckoutPaymentAudit }
  | { accepted: true; path: "fully_discounted"; audit: CheckoutPaymentAudit }
  | {
      accepted: false;
      path: "payment_exception";
      reason: string;
      audit: CheckoutPaymentAudit;
    };

function stripeObjectId(value: Stripe.Checkout.Session.Discount["promotion_code"]): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return null;
}

export function extractCheckoutDiscountIdentifiers(session: Stripe.Checkout.Session): {
  promotionCodeId: string | null;
  couponId: string | null;
} {
  const discounts = session.discounts ?? [];

  for (const discount of discounts) {
    const promotionCodeId = stripeObjectId(discount.promotion_code);
    const couponId = stripeObjectId(discount.coupon);
    if (promotionCodeId || couponId) {
      return { promotionCodeId, couponId };
    }
  }

  return { promotionCodeId: null, couponId: null };
}

export function resolveCheckoutDiscountAmountCents(session: Stripe.Checkout.Session): number {
  const fromTotalDetails = session.total_details?.amount_discount;
  if (typeof fromTotalDetails === "number" && fromTotalDetails > 0) {
    return fromTotalDetails;
  }

  const subtotal = session.amount_subtotal;
  const paid = session.amount_total ?? 0;
  if (typeof subtotal === "number" && subtotal > paid) {
    return subtotal - paid;
  }

  return 0;
}

function hasStripeDiscountEvidence(session: Stripe.Checkout.Session): boolean {
  if (resolveCheckoutDiscountAmountCents(session) > 0) return true;
  return Array.isArray(session.discounts) && session.discounts.length > 0;
}

function isCompletedCheckoutPaymentStatus(status: string): boolean {
  return status === "paid" || status === "no_payment_required";
}

export function buildCheckoutPaymentAudit(
  session: Stripe.Checkout.Session,
  catalogueAmountCents: number,
): CheckoutPaymentAudit {
  const paidAmountCents = session.amount_total ?? 0;
  const discountAmountCents = resolveCheckoutDiscountAmountCents(session);
  const { promotionCodeId, couponId } = extractCheckoutDiscountIdentifiers(session);

  return {
    catalogueAmountCents,
    paidAmountCents,
    discountAmountCents,
    amountSubtotalCents:
      typeof session.amount_subtotal === "number" ? session.amount_subtotal : null,
    promotionCodeId,
    couponId,
  };
}

function isFullyDiscountedCheckout(
  session: Stripe.Checkout.Session,
  catalogueAmountCents: number,
): boolean {
  const paidAmountCents = session.amount_total ?? 0;
  if (paidAmountCents !== 0) return false;
  if (!isCompletedCheckoutPaymentStatus(session.payment_status ?? "")) return false;
  if (!hasStripeDiscountEvidence(session)) return false;

  const discountAmountCents = resolveCheckoutDiscountAmountCents(session);
  if (discountAmountCents < catalogueAmountCents) return false;

  const subtotal = session.amount_subtotal;
  if (typeof subtotal === "number") {
    if (subtotal !== catalogueAmountCents) return false;
    if (subtotal - discountAmountCents !== paidAmountCents) return false;
    return true;
  }

  return discountAmountCents === catalogueAmountCents;
}

export function validateCheckoutSessionPayment(
  readingType: AskLeiliaDbReadingType,
  session: Stripe.Checkout.Session,
): CheckoutPaymentValidationResult {
  const currency = (session.currency ?? "usd").toLowerCase();
  const catalogueAmountCents = expectedPaymentCents(readingType);
  const paidAmountCents = session.amount_total ?? 0;
  const paymentStatus = session.payment_status ?? "";
  const audit = buildCheckoutPaymentAudit(session, catalogueAmountCents);

  if (currency !== "usd") {
    return {
      accepted: false,
      path: "payment_exception",
      reason: `Unsupported currency: ${currency}.`,
      audit,
    };
  }

  if (!isCompletedCheckoutPaymentStatus(paymentStatus)) {
    return {
      accepted: false,
      path: "payment_exception",
      reason: `Checkout session is not fully paid (payment_status=${paymentStatus}).`,
      audit,
    };
  }

  if (paidAmountCents === catalogueAmountCents) {
    return { accepted: true, path: "normal", audit };
  }

  if (isFullyDiscountedCheckout(session, catalogueAmountCents)) {
    return { accepted: true, path: "fully_discounted", audit };
  }

  return {
    accepted: false,
    path: "payment_exception",
    reason: `Catalogue price ${catalogueAmountCents} ${currency}, checkout total ${paidAmountCents}.`,
    audit,
  };
}
