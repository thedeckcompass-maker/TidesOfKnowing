import type { AskLeiliaRequest, AskLeiliaStatus } from "./types";

/** Operational fulfilment states shown in the admin queue (payment status is separate). */
export const ASK_LEILIA_FULFILMENT_STATUSES = [
  "new",
  "in_progress",
  "ready_to_send",
  "delivered",
  "archived",
] as const;

export type AskLeiliaFulfilmentStatus = (typeof ASK_LEILIA_FULFILMENT_STATUSES)[number];

export const ASK_LEILIA_REVIEW_WORKFLOW_STATUSES = [
  "not_requested",
  "requested",
  "provided",
] as const;

export type AskLeiliaReviewWorkflowStatus =
  (typeof ASK_LEILIA_REVIEW_WORKFLOW_STATUSES)[number];

export const ASK_LEILIA_DELIVERY_METHODS = [
  "system_email",
  "personal_email",
  "messaging_service",
  "other",
] as const;

export type AskLeiliaDeliveryMethod = (typeof ASK_LEILIA_DELIVERY_METHODS)[number];

export const ASK_LEILIA_MANUAL_DELIVERY_METHODS = [
  "personal_email",
  "messaging_service",
  "other",
] as const;

export type AskLeiliaManualDeliveryMethod =
  (typeof ASK_LEILIA_MANUAL_DELIVERY_METHODS)[number];

export const ASK_LEILIA_MANUAL_PAYMENT_METHODS = [
  "paypal",
  "bank_transfer",
  "cash",
  "other",
  "waived_complimentary",
] as const;

export type AskLeiliaManualPaymentMethod =
  (typeof ASK_LEILIA_MANUAL_PAYMENT_METHODS)[number];

/**
 * Workflow statuses that imply Stripe (or complimentary) payment already verified.
 * Pending Payment / Payment Exception are unpaid Stripe outcomes — never treated as verified.
 */
export const ASK_LEILIA_STRIPE_VERIFIED_STATUSES: AskLeiliaStatus[] = [
  "Paid",
  "In Progress",
  "Delivered",
];

/** @deprecated Use isAskLeiliaEffectivelyPaid — retained name for older call sites. */
export const ASK_LEILIA_ACTIONABLE_STATUSES = ASK_LEILIA_STRIPE_VERIFIED_STATUSES;

export const ASK_LEILIA_FULFILMENT_LABELS: Record<AskLeiliaFulfilmentStatus, string> = {
  new: "New",
  in_progress: "In progress",
  ready_to_send: "Ready to send",
  delivered: "Delivered",
  archived: "Archived",
};

export const ASK_LEILIA_REVIEW_WORKFLOW_LABELS: Record<
  AskLeiliaReviewWorkflowStatus,
  string
> = {
  not_requested: "Not requested",
  requested: "Requested",
  provided: "Provided",
};

export const ASK_LEILIA_DELIVERY_METHOD_LABELS: Record<AskLeiliaDeliveryMethod, string> = {
  system_email: "System email",
  personal_email: "Personal email",
  messaging_service: "Messaging service",
  other: "Other",
};

export const ASK_LEILIA_MANUAL_PAYMENT_METHOD_LABELS: Record<
  AskLeiliaManualPaymentMethod,
  string
> = {
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  other: "Other",
  waived_complimentary: "Waived or complimentary",
};

const STRIPE_SUCCESS_PAYMENT_STATUSES = new Set([
  "paid",
  "complete",
  "succeeded",
  "success",
]);

export type PaymentStateFields = Pick<
  AskLeiliaRequest,
  | "status"
  | "payment_id"
  | "manually_marked_paid"
  | "manual_payment_method"
  | "manual_payment_reference"
  | "manual_payment_note"
  | "manual_payment_recorded_at"
  | "manual_payment_recorded_by"
  | "manual_payment_reversed_at"
  | "reading_type"
  | "payment"
>;

/**
 * Verified Stripe (or complimentary insert) payment — never invented from redirects.
 * Raw `request.status` of Pending Payment / Payment Exception always returns false.
 * Manual-only fulfilment (no payment_id) does not count as Stripe-verified.
 */
export function isAskLeiliaStripePaymentVerified(request: PaymentStateFields): boolean {
  if (request.status === "Pending Payment" || request.status === "Payment Exception") {
    return false;
  }

  const stripeStatus = request.payment?.payment_status?.trim().toLowerCase() ?? "";
  if (stripeStatus && STRIPE_SUCCESS_PAYMENT_STATUSES.has(stripeStatus)) {
    return true;
  }

  if (request.payment_id && ASK_LEILIA_STRIPE_VERIFIED_STATUSES.includes(request.status)) {
    return true;
  }

  if (
    request.reading_type === "complimentary" &&
    ASK_LEILIA_STRIPE_VERIFIED_STATUSES.includes(request.status)
  ) {
    return true;
  }

  // Started via manual override only — not a Stripe-verified success.
  if (
    request.manually_marked_paid &&
    !request.payment_id &&
    request.reading_type !== "complimentary"
  ) {
    return false;
  }

  // Webhook Paid / complimentary / started after verified payment.
  // Manual-only rows stay Pending Payment until started; after reverse they revert there.
  if (ASK_LEILIA_STRIPE_VERIFIED_STATUSES.includes(request.status)) {
    return true;
  }

  return false;
}

/** Active administrative override (not reversed). */
export function isAskLeiliaManualPaymentActive(request: PaymentStateFields): boolean {
  return Boolean(request.manually_marked_paid) && !request.manual_payment_reversed_at;
}

/** Effective payment for UI and fulfilment gating. */
export function isAskLeiliaEffectivelyPaid(request: PaymentStateFields): boolean {
  return isAskLeiliaStripePaymentVerified(request) || isAskLeiliaManualPaymentActive(request);
}

export type EffectivePaymentState = "paid" | "unpaid";

export function deriveAskLeiliaEffectivePaymentState(
  request: PaymentStateFields,
): EffectivePaymentState {
  return isAskLeiliaEffectivelyPaid(request) ? "paid" : "unpaid";
}

export function effectivePaymentLabel(state: EffectivePaymentState): string {
  return state === "paid" ? "Paid" : "Unpaid";
}

/** Compact human summary distinguishing Stripe vs manual vs waived. */
export function describeAskLeiliaPaymentSource(request: PaymentStateFields): string {
  const stripeVerified = isAskLeiliaStripePaymentVerified(request);
  const manualActive = isAskLeiliaManualPaymentActive(request);

  if (stripeVerified && !manualActive) {
    return "Paid via Stripe";
  }

  if (manualActive) {
    const method = request.manual_payment_method;
    if (method === "waived_complimentary") {
      return "Waived or complimentary";
    }
    if (method && ASK_LEILIA_MANUAL_PAYMENT_METHOD_LABELS[method]) {
      return `Manually marked as paid via ${ASK_LEILIA_MANUAL_PAYMENT_METHOD_LABELS[method]}`;
    }
    return "Manually marked as paid";
  }

  if (request.status === "Payment Exception") {
    return "Unpaid — Stripe payment exception";
  }
  if (request.status === "Pending Payment") {
    return "Unpaid — Stripe payment incomplete";
  }
  return "Unpaid";
}

export function rawStripeStatusLabel(request: PaymentStateFields): string {
  const paymentStatus = request.payment?.payment_status?.trim();
  if (paymentStatus) return paymentStatus;
  if (request.status === "Payment Exception") return "Payment Exception";
  if (request.status === "Pending Payment") return "Pending Payment";
  if (request.status === "Paid" || request.status === "In Progress" || request.status === "Delivered") {
    return request.status === "Paid" ? "Paid" : request.status;
  }
  return request.status;
}

export type FulfilmentRequestFields = Pick<
  AskLeiliaRequest,
  | "status"
  | "archived_at"
  | "delivery_pdf_path"
  | "delivered_at"
  | "delivery_sent_at"
  | "manually_delivered"
  | "last_resent_at"
  | "review_status"
  | "linked_review_id"
>;

/**
 * Derive operational fulfilment status.
 * ready_to_send is never stored — it means not delivered/archived and a completed PDF exists.
 * Unpaid Pending Payment / Payment Exception still map to "new" so they stay visible.
 */
export function deriveAskLeiliaFulfilmentStatus(
  request: FulfilmentRequestFields,
): AskLeiliaFulfilmentStatus {
  if (request.archived_at) return "archived";
  if (request.status === "Delivered") return "delivered";
  if (request.delivery_pdf_path) return "ready_to_send";
  if (request.status === "In Progress") return "in_progress";
  return "new";
}

export function fulfilmentStatusLabel(status: AskLeiliaFulfilmentStatus): string {
  return ASK_LEILIA_FULFILMENT_LABELS[status];
}

export function reviewWorkflowStatusLabel(status: AskLeiliaReviewWorkflowStatus): string {
  return ASK_LEILIA_REVIEW_WORKFLOW_LABELS[status];
}

export function resolveReviewWorkflowStatus(
  request: Pick<AskLeiliaRequest, "review_status" | "linked_review_id">,
): AskLeiliaReviewWorkflowStatus {
  if (request.linked_review_id || request.review_status === "provided") {
    return "provided";
  }
  if (request.review_status === "requested") return "requested";
  return "not_requested";
}

export function isAskLeiliaDeliveryMethod(value: unknown): value is AskLeiliaDeliveryMethod {
  return (
    typeof value === "string" &&
    ASK_LEILIA_DELIVERY_METHODS.includes(value as AskLeiliaDeliveryMethod)
  );
}

export function isAskLeiliaManualDeliveryMethod(
  value: unknown,
): value is AskLeiliaManualDeliveryMethod {
  return (
    typeof value === "string" &&
    ASK_LEILIA_MANUAL_DELIVERY_METHODS.includes(value as AskLeiliaManualDeliveryMethod)
  );
}

export function isAskLeiliaManualPaymentMethod(
  value: unknown,
): value is AskLeiliaManualPaymentMethod {
  return (
    typeof value === "string" &&
    ASK_LEILIA_MANUAL_PAYMENT_METHODS.includes(value as AskLeiliaManualPaymentMethod)
  );
}

export function isAskLeiliaReviewWorkflowStatus(
  value: unknown,
): value is AskLeiliaReviewWorkflowStatus {
  return (
    typeof value === "string" &&
    ASK_LEILIA_REVIEW_WORKFLOW_STATUSES.includes(value as AskLeiliaReviewWorkflowStatus)
  );
}

export type PdfDeliveryLabel =
  | "No PDF"
  | "PDF uploaded"
  | "Sent"
  | "Manually delivered"
  | "Resent";

export function derivePdfDeliverySummary(request: FulfilmentRequestFields): {
  label: PdfDeliveryLabel;
  at: string | null;
} {
  const fulfilment = deriveAskLeiliaFulfilmentStatus(request);

  if (fulfilment === "delivered") {
    if (request.manually_delivered) {
      return { label: "Manually delivered", at: request.delivered_at };
    }
    if (request.last_resent_at) {
      return { label: "Resent", at: request.last_resent_at };
    }
    return {
      label: "Sent",
      at: request.delivery_sent_at ?? request.delivered_at,
    };
  }

  if (request.delivery_pdf_path) {
    return { label: "PDF uploaded", at: null };
  }

  return { label: "No PDF", at: null };
}

export type AskLeiliaPrimaryAction =
  | "start"
  | "open"
  | "send"
  | "mark_paid"
  | "view"
  | "view_review"
  | "restore";

export function primaryActionForRequest(
  request: FulfilmentRequestFields & PaymentStateFields,
): AskLeiliaPrimaryAction {
  const fulfilment = deriveAskLeiliaFulfilmentStatus(request);
  const review = resolveReviewWorkflowStatus(request);
  const paid = isAskLeiliaEffectivelyPaid(request);

  if (fulfilment === "archived") return "restore";
  if (!paid) return "mark_paid";
  if (fulfilment === "new") return "start";
  if (fulfilment === "ready_to_send") return "send";
  if (fulfilment === "in_progress") return "open";
  if (fulfilment === "delivered" && review === "provided") return "view_review";
  if (fulfilment === "delivered") return "view";
  return "open";
}

export const PRIMARY_ACTION_LABELS: Record<AskLeiliaPrimaryAction, string> = {
  start: "Start",
  open: "Open",
  send: "Send",
  mark_paid: "Mark paid",
  view: "View",
  view_review: "View review",
  restore: "Restore",
};
