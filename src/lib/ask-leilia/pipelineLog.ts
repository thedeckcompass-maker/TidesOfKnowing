export const ASK_LEILIA_PIPELINE_EVENTS = [
  "CHECKOUT_START",
  "REQUEST_INSERT_SUCCESS",
  "REQUEST_INSERT_FAILURE",
  "REDIRECT_TO_STRIPE",
  "WEBHOOK_RECEIVED",
  "WEBHOOK_SIGNATURE_VERIFIED",
  "PAYMENT_UPSERT_SUCCESS",
  "PAYMENT_UPSERT_FAILURE",
  "REQUEST_LINK_SUCCESS",
  "REQUEST_LINK_FAILURE",
  "PAYMENT_VALIDATED",
  "PAYMENT_EXCEPTION",
  "STATUS_UPDATED_TO_PAID",
  "STATUS_UPDATE_FAILED",
  "INTERNAL_EMAIL_SENT",
  "INTERNAL_EMAIL_FAILED",
  "CUSTOMER_EMAIL_SENT",
  "CUSTOMER_EMAIL_FAILED",
  "WEBHOOK_COMPLETE",
] as const;

export type AskLeiliaPipelineEvent = (typeof ASK_LEILIA_PIPELINE_EVENTS)[number];

export type AskLeiliaPipelineLogFields = {
  requestId?: string;
  stripeSessionId?: string;
  paymentIntent?: string;
  customerEmail?: string;
  readingType?: string;
  requestStatus?: string;
  paymentAmount?: number;
  currency?: string;
  error?: string;
  stripeEventId?: string;
  stripeEventType?: string;
  paymentId?: string;
};

export function logAskLeiliaPipeline(
  event: AskLeiliaPipelineEvent,
  fields: AskLeiliaPipelineLogFields = {},
): void {
  const payload: Record<string, unknown> = {
    askLeiliaPipeline: event,
    timestamp: new Date().toISOString(),
  };

  if (fields.requestId) payload.requestId = fields.requestId;
  if (fields.stripeSessionId) payload.stripeSessionId = fields.stripeSessionId;
  if (fields.paymentIntent) payload.paymentIntent = fields.paymentIntent;
  if (fields.customerEmail) payload.customerEmail = fields.customerEmail;
  if (fields.readingType) payload.readingType = fields.readingType;
  if (fields.requestStatus) payload.requestStatus = fields.requestStatus;
  if (fields.paymentAmount !== undefined) payload.paymentAmount = fields.paymentAmount;
  if (fields.currency) payload.currency = fields.currency;
  if (fields.error) payload.error = fields.error;
  if (fields.stripeEventId) payload.stripeEventId = fields.stripeEventId;
  if (fields.stripeEventType) payload.stripeEventType = fields.stripeEventType;
  if (fields.paymentId) payload.paymentId = fields.paymentId;

  console.log(JSON.stringify(payload));
}
