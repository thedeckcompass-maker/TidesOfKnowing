import type { AskLeiliaCardPreference, AskLeiliaStatus } from "./types";
import { ASK_LEILIA_STATUSES } from "./types";
import {
  isAskLeiliaEffectivelyPaid,
  isAskLeiliaManualPaymentActive,
  isAskLeiliaManualPaymentMethod,
  isAskLeiliaStripePaymentVerified,
  type AskLeiliaManualPaymentMethod,
  type PaymentStateFields,
} from "./fulfilment";
import { isAskLeiliaDbReadingType } from "./readingTypes";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n");
}

export function isAskLeiliaStatus(value: unknown): value is AskLeiliaStatus {
  return typeof value === "string" && ASK_LEILIA_STATUSES.includes(value as AskLeiliaStatus);
}

export function isCardPreference(value: unknown): value is AskLeiliaCardPreference {
  return value === "pull_for_me" || value === "own_cards_attached";
}

export function isAskLeiliaReadingTypeFilter(value: unknown): boolean {
  return value === "all" || isAskLeiliaDbReadingType(value);
}

/** Effective payment gates fulfilment — Stripe verified OR active manual override. */
export function isActionableAskLeiliaStatus(status: AskLeiliaStatus): boolean {
  return status === "Paid" || status === "In Progress" || status === "Delivered";
}

/**
 * Legacy status-dropdown transitions (payment exception resolution, etc.).
 * Fulfilment workflow prefers explicit actions (start / send / archive).
 */
export function validateStatusTransition(input: {
  currentStatus: AskLeiliaStatus;
  nextStatus: AskLeiliaStatus;
  hasDeliveryPdf: boolean;
}): ValidationResult<AskLeiliaStatus> {
  const { currentStatus, nextStatus, hasDeliveryPdf } = input;

  if (currentStatus === nextStatus) {
    return { ok: true, value: nextStatus };
  }

  if (nextStatus === "Delivered" && !hasDeliveryPdf) {
    return {
      ok: false,
      error: "Upload the completed PDF before marking this request as Delivered.",
    };
  }

  if (currentStatus === "Payment Exception") {
    if (nextStatus === "Paid") {
      return { ok: true, value: nextStatus };
    }

    return {
      ok: false,
      error: "Resolve the payment exception by setting the status to Paid before continuing.",
    };
  }

  if (nextStatus === "Payment Exception") {
    return {
      ok: false,
      error: "Payment Exception can only be set automatically when Stripe payment validation fails.",
    };
  }

  if (currentStatus === "Pending Payment" && nextStatus !== currentStatus) {
    return {
      ok: false,
      error: "Pending Payment requests are updated automatically after Stripe payment.",
    };
  }

  return { ok: true, value: nextStatus };
}

/** @deprecated Prefer contextual fulfilment actions. Kept for payment-exception resolution. */
export function adminSelectableStatuses(currentStatus: AskLeiliaStatus): AskLeiliaStatus[] {
  if (currentStatus === "Payment Exception") {
    return ["Payment Exception", "Paid"];
  }

  if (currentStatus === "Pending Payment") {
    return ["Pending Payment"];
  }

  return ["Paid", "In Progress", "Delivered"];
}

export function validateStartReading(input: {
  status: AskLeiliaStatus;
  archivedAt: string | null;
  effectivelyPaid: boolean;
}): ValidationResult<"In Progress"> {
  if (input.archivedAt) {
    return { ok: false, error: "Restore this reading before starting work." };
  }
  if (!input.effectivelyPaid) {
    return {
      ok: false,
      error: "Mark this reading as paid before starting fulfilment.",
    };
  }
  if (input.status === "Delivered") {
    return { ok: false, error: "This reading has already been delivered." };
  }
  return { ok: true, value: "In Progress" };
}

export function validateSystemDelivery(input: {
  status: AskLeiliaStatus;
  archivedAt: string | null;
  hasDeliveryPdf: boolean;
  email: string;
  effectivelyPaid: boolean;
}): ValidationResult<true> {
  if (input.archivedAt) {
    return { ok: false, error: "Restore this reading before sending." };
  }
  if (input.status === "Delivered") {
    return { ok: false, error: "This reading has already been delivered. Use Resend instead." };
  }
  if (!input.effectivelyPaid) {
    return { ok: false, error: "Mark this reading as paid before sending." };
  }
  if (!input.hasDeliveryPdf) {
    return { ok: false, error: "Upload a completed reading PDF before sending." };
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "A valid client email address is required to send the reading." };
  }
  return { ok: true, value: true };
}

export function validateManualDelivery(input: {
  status: AskLeiliaStatus;
  archivedAt: string | null;
  effectivelyPaid: boolean;
}): ValidationResult<true> {
  if (input.archivedAt) {
    return { ok: false, error: "Restore this reading before marking it delivered." };
  }
  if (input.status === "Delivered") {
    return { ok: false, error: "This reading has already been delivered." };
  }
  if (!input.effectivelyPaid) {
    return { ok: false, error: "Mark this reading as paid before marking delivery." };
  }
  return { ok: true, value: true };
}

export function validateUploadDeliveryPdf(input: {
  archivedAt: string | null;
  effectivelyPaid: boolean;
}): ValidationResult<true> {
  if (input.archivedAt) {
    return { ok: false, error: "Restore this reading before uploading a PDF." };
  }
  if (!input.effectivelyPaid) {
    return { ok: false, error: "Mark this reading as paid before uploading a completed PDF." };
  }
  return { ok: true, value: true };
}

export function validateMarkAsPaid(input: {
  effectivelyPaid: boolean;
  method: unknown;
  reference: unknown;
  note: unknown;
}): ValidationResult<{
  method: AskLeiliaManualPaymentMethod;
  reference: string | null;
  note: string | null;
}> {
  if (input.effectivelyPaid) {
    return { ok: false, error: "This reading is already effectively paid." };
  }
  if (!isAskLeiliaManualPaymentMethod(input.method)) {
    return { ok: false, error: "Choose a payment method." };
  }
  const reference = cleanText(input.reference).slice(0, 200) || null;
  const note = cleanText(input.note).slice(0, 2000) || null;
  return { ok: true, value: { method: input.method, reference, note } };
}

export function validateReverseManualPayment(input: PaymentStateFields): ValidationResult<true> {
  if (!isAskLeiliaManualPaymentActive(input)) {
    return { ok: false, error: "There is no active manual payment confirmation to reverse." };
  }
  if (input.status === "Delivered") {
    return {
      ok: false,
      error: "Manual payment cannot be reversed after the reading has been delivered.",
    };
  }
  return { ok: true, value: true };
}

export function validateResendDelivery(input: {
  status: AskLeiliaStatus;
  hasDeliveryPdf: boolean;
  email: string;
}): ValidationResult<true> {
  if (input.status !== "Delivered") {
    return { ok: false, error: "Only delivered readings can be resent." };
  }
  if (!input.hasDeliveryPdf) {
    return { ok: false, error: "A completed reading PDF is required to resend." };
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "A valid client email address is required to resend." };
  }
  return { ok: true, value: true };
}

export function validateRemoveDeliveryPdf(input: {
  status: AskLeiliaStatus;
  hasDeliveryPdf: boolean;
}): ValidationResult<true> {
  if (!input.hasDeliveryPdf) {
    return { ok: false, error: "There is no completed reading PDF to remove." };
  }
  if (input.status === "Delivered") {
    return {
      ok: false,
      error:
        "Completed PDFs cannot be removed after delivery. Upload a replacement if you need a corrected file.",
    };
  }
  return { ok: true, value: true };
}

export function validateRequestReview(input: {
  status: AskLeiliaStatus;
  reviewStatus: string;
  linkedReviewId: string | null;
}): ValidationResult<true> {
  if (input.status !== "Delivered") {
    return { ok: false, error: "Request a review only after the reading has been delivered." };
  }
  if (input.linkedReviewId || input.reviewStatus === "provided") {
    return { ok: false, error: "A review has already been provided for this reading." };
  }
  return { ok: true, value: true };
}

/** After reversing a manual override, restore Stripe lifecycle status when fulfilment was not Stripe-verified. */
export function statusAfterManualPaymentReversal(input: PaymentStateFields): AskLeiliaStatus {
  if (isAskLeiliaStripePaymentVerified({ ...input, manually_marked_paid: false })) {
    return input.status;
  }
  if (input.status === "In Progress" || input.status === "Paid") {
    return "Pending Payment";
  }
  return input.status;
}

// Re-export for admin callers that already import payment helpers via validation.
export { isAskLeiliaEffectivelyPaid, isAskLeiliaStripePaymentVerified };

export function validateAskLeiliaRequest(input: {
  name: unknown;
  email: unknown;
  question: unknown;
  context: unknown;
  cardPreference: unknown;
}): ValidationResult<{
  name: string;
  email: string;
  question: string;
  context: string;
  cardPreference: AskLeiliaCardPreference;
}> {
  const name = cleanText(input.name).replace(/\s+/g, " ");
  const email = cleanText(input.email).toLowerCase();
  const question = cleanText(input.question);
  const context = cleanText(input.context);

  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Please enter your name." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (question.length < 10 || question.length > 2000) {
    return { ok: false, error: "Please enter one question, between 10 and 2,000 characters." };
  }

  if (context.length > 5000) {
    return { ok: false, error: "Please keep additional context under 5,000 characters." };
  }

  if (!isCardPreference(input.cardPreference)) {
    return { ok: false, error: "Please choose a card preference." };
  }

  return { ok: true, value: { name, email, question, context, cardPreference: input.cardPreference } };
}

function validateNameAndEmail(input: { name: unknown; email: unknown }):
  | { ok: true; name: string; email: string }
  | { ok: false; error: string } {
  const name = cleanText(input.name).replace(/\s+/g, " ");
  const email = cleanText(input.email).toLowerCase();

  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Please enter your name." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  return { ok: true, name, email };
}

export function validateInDepthRequest(input: {
  name: unknown;
  email: unknown;
  primaryQuestion: unknown;
  background: unknown;
  outcome: unknown;
  beforeBegin?: unknown;
}): ValidationResult<{
  name: string;
  email: string;
  question: string;
  context: string;
}> {
  const identity = validateNameAndEmail(input);
  if (!identity.ok) return identity;

  const primaryQuestion = cleanText(input.primaryQuestion);
  const background = cleanText(input.background);
  const outcome = cleanText(input.outcome);
  const beforeBegin = cleanText(input.beforeBegin);

  if (primaryQuestion.length < 10 || primaryQuestion.length > 2000) {
    return {
      ok: false,
      error: "Please enter your primary question, between 10 and 2,000 characters.",
    };
  }

  if (outcome.length < 10 || outcome.length > 2000) {
    return {
      ok: false,
      error:
        "Please describe the outcome or clarity you are seeking, between 10 and 2,000 characters.",
    };
  }

  if (background.length > 5000) {
    return { ok: false, error: "Please keep background details under 5,000 characters." };
  }

  if (beforeBegin.length > 5000) {
    return {
      ok: false,
      error: "Please keep additional preparation notes under 5,000 characters.",
    };
  }

  const contextParts = [
    background ? `What has brought you to this point:\n${background}` : "",
    `Outcome or understanding you are hoping for:\n${outcome}`,
    beforeBegin ? `Anything to know before beginning:\n${beforeBegin}` : "",
  ].filter(Boolean);

  return {
    ok: true,
    value: {
      name: identity.name,
      email: identity.email,
      question: primaryQuestion,
      context: contextParts.join("\n\n"),
    },
  };
}

export function formatPersonalGuidanceLifeAreas(
  lifeAreas: string[],
  lifeAreaOther: string,
): string[] {
  return lifeAreas.map((area) =>
    area === "Other" ? `Other: ${lifeAreaOther}` : area,
  );
}

export function validatePersonalGuidanceRequest(input: {
  name: unknown;
  email: unknown;
  questions: unknown;
  circumstances: unknown;
  lookingAhead: unknown;
  important?: unknown;
  lifeAreas?: unknown;
  lifeAreaOther?: unknown;
}): ValidationResult<{
  name: string;
  email: string;
  question: string;
  context: string;
}> {
  const identity = validateNameAndEmail(input);
  if (!identity.ok) return identity;

  const questions = cleanText(input.questions);
  const circumstances = cleanText(input.circumstances);
  const lookingAhead = cleanText(input.lookingAhead);
  const important = cleanText(input.important);
  const lifeAreaOther = cleanText(input.lifeAreaOther).replace(/\s+/g, " ").trim();
  const lifeAreas = Array.isArray(input.lifeAreas)
    ? input.lifeAreas.map((area) => cleanText(area)).filter(Boolean)
    : input.lifeAreas
      ? [cleanText(input.lifeAreas)].filter(Boolean)
      : [];
  const hasOther = lifeAreas.includes("Other");

  if (lifeAreas.length === 0) {
    return { ok: false, error: "Please select at least one life area." };
  }

  if (hasOther) {
    if (lifeAreaOther.length < 1) {
      return { ok: false, error: "Please specify your other life area." };
    }

    if (lifeAreaOther.length > 100) {
      return { ok: false, error: "Please keep your other life area under 100 characters." };
    }
  } else if (lifeAreaOther.length > 0) {
    return { ok: false, error: "Please select Other before specifying an additional life area." };
  }

  const formattedLifeAreas = hasOther
    ? formatPersonalGuidanceLifeAreas(lifeAreas, lifeAreaOther)
    : lifeAreas;

  if (questions.length < 10 || questions.length > 2000) {
    return {
      ok: false,
      error:
        "Please share your questions or life areas, between 10 and 2,000 characters.",
    };
  }

  if (circumstances.length < 10 || circumstances.length > 5000) {
    return {
      ok: false,
      error: "Please describe your current circumstances, between 10 and 5,000 characters.",
    };
  }

  if (lookingAhead.length < 10 || lookingAhead.length > 2000) {
    return {
      ok: false,
      error:
        "Please describe what you are looking ahead to, between 10 and 2,000 characters.",
    };
  }

  if (important.length > 5000) {
    return { ok: false, error: "Please keep additional notes under 5,000 characters." };
  }

  const contextParts = [
    `Life areas:\n${formattedLifeAreas.join(", ")}`,
    `Current circumstances:\n${circumstances}`,
    `Looking ahead:\n${lookingAhead}`,
    important ? `Anything else to address:\n${important}` : "",
  ].filter(Boolean);

  return {
    ok: true,
    value: {
      name: identity.name,
      email: identity.email,
      question: questions,
      context: contextParts.join("\n\n"),
    },
  };
}
