import { COMPASS_PAYMENT_LINK } from "../../data/training/compass-cohorts";
import { buildPaymentLinkRedirectUrl } from "../ask-leilia/paymentLinks";

export { COMPASS_PAYMENT_LINK };

/** Required Stripe Payment Link success URL (configure in Stripe Dashboard; do not change live settings from code). */
export const COMPASS_STRIPE_SUCCESS_URL =
  "https://www.tidesofknowing.com/compass/thank-you/?session_id={CHECKOUT_SESSION_ID}";

/** Redirect to the COMPASS US$997 Payment Link with enrolment association. */
export function buildCompassPaymentRedirectUrl(enrolmentId: string, email: string): string {
  return buildPaymentLinkRedirectUrl(COMPASS_PAYMENT_LINK, enrolmentId, email);
}
