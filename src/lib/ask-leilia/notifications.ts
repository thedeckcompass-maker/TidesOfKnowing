import { Resend } from "resend";
import { communityEnv } from "../community/env";
import { formatUsdCents } from "./paymentAmounts";
import { logAskLeiliaPipeline } from "./pipelineLog";
import { readingTypeLabel, type AskLeiliaDbReadingType } from "./readingTypes";
import { cardPreferenceLabel, type AskLeiliaCardPreference, type AskLeiliaStatus } from "./types";

function notifyEmail(locals?: unknown): string {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string | undefined> } } | undefined)
    ?.runtime?.env;
  return (
    runtimeEnv?.ASK_LEILIA_NOTIFY_EMAIL ??
    (import.meta.env.ASK_LEILIA_NOTIFY_EMAIL as string | undefined) ??
    "hello@tidesofknowing.com"
  );
}

async function sendAskLeiliaNotification(
  subject: string,
  lines: string[],
  locals?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    const error = "EMAIL_API_KEY is not configured.";
    console.error("Ask Leilia notification skipped: EMAIL_API_KEY is not configured.");
    return { ok: false, error };
  }

  const resend = new Resend(env.emailApiKey);
  const result = await resend.emails.send({
    from: "Tides of Knowing <hello@tidesofknowing.com>",
    to: notifyEmail(locals),
    subject,
    text: lines.join("\n"),
  });

  if (result.error) {
    console.error("Ask Leilia notification failed:", result.error);
    return { ok: false, error: result.error.message ?? "Resend send failed." };
  }

  return { ok: true };
}

export async function notifyAskLeiliaPaymentCompleted(
  input: {
    customerEmail: string;
    amount: number;
    currency: string;
    paymentIntent: string;
    request?: {
      id: string;
      name: string;
      email: string;
      question: string;
      context: string | null;
      cardPreference: AskLeiliaCardPreference;
      imageUrl: string | null;
      readingType: AskLeiliaDbReadingType;
    } | null;
    paymentAudit?: {
      catalogueAmountCents: number;
      paidAmountCents: number;
      discountAmountCents: number;
      promotionCodeId: string | null;
      couponId: string | null;
      fullyDiscounted: boolean;
    };
  },
  locals?: unknown,
): Promise<void> {
  const requestLines = input.request
    ? [
        "",
        "Linked request:",
        `Request id: ${input.request.id}`,
        `Name: ${input.request.name}`,
        `Email: ${input.request.email}`,
        `Reading type: ${readingTypeLabel(input.request.readingType)}`,
        `Card preference: ${cardPreferenceLabel(input.request.cardPreference)}`,
        `Image uploaded: ${input.request.imageUrl ? "Yes" : "No"}`,
        "",
        "Question:",
        input.request.question,
        "",
        "Context:",
        input.request.context || "No additional context.",
      ]
    : [
        "",
        "No linked request was found. The customer may need to complete a request form at /ask-leilia/ before payment.",
      ];

  const pipelineFields = {
    requestId: input.request?.id,
    paymentIntent: input.paymentIntent,
    customerEmail: input.customerEmail,
    readingType: input.request?.readingType,
    requestStatus: input.request ? "Paid" : undefined,
    paymentAmount: input.amount,
    currency: input.currency,
    validationPath: input.paymentAudit?.fullyDiscounted
      ? ("fully_discounted" as const)
      : ("normal" as const),
    catalogueAmountCents: input.paymentAudit?.catalogueAmountCents,
    discountAmountCents: input.paymentAudit?.discountAmountCents,
    promotionCodeId: input.paymentAudit?.promotionCodeId ?? undefined,
    couponId: input.paymentAudit?.couponId ?? undefined,
  };

  const paymentLines = input.paymentAudit?.fullyDiscounted
    ? [
        "Payment fulfilled with a 100% Stripe promotion/discount.",
        "",
        `Catalogue price: ${formatUsdCents(input.paymentAudit.catalogueAmountCents)}`,
        `Amount paid: ${formatUsdCents(input.paymentAudit.paidAmountCents)}`,
        `Discount applied: ${formatUsdCents(input.paymentAudit.discountAmountCents)}`,
        input.paymentAudit.promotionCodeId
          ? `Stripe promotion code: ${input.paymentAudit.promotionCodeId}`
          : null,
        input.paymentAudit.couponId ? `Stripe coupon: ${input.paymentAudit.couponId}` : null,
        `Stripe payment intent: ${input.paymentIntent}`,
      ].filter((line): line is string => Boolean(line))
    : [
        `Amount: ${input.amount} ${input.currency.toUpperCase()}`,
        `Stripe payment intent: ${input.paymentIntent}`,
      ];

  const result = await sendAskLeiliaNotification(
    input.request
      ? input.paymentAudit?.fullyDiscounted
        ? "Ask Leilia request paid (100% promotion)"
        : "Ask Leilia request paid"
      : "Ask Leilia payment completed",
    [
      input.paymentAudit?.fullyDiscounted
        ? "An Ask Leilia checkout completed using a 100% Stripe promotion/discount."
        : "An Ask Leilia payment has completed.",
      "",
      `Customer email: ${input.customerEmail}`,
      ...paymentLines,
      ...requestLines,
    ],
    locals,
  );

  if (result.ok) {
    logAskLeiliaPipeline("INTERNAL_EMAIL_SENT", pipelineFields);
  } else {
    logAskLeiliaPipeline("INTERNAL_EMAIL_FAILED", {
      ...pipelineFields,
      error: result.error,
    });
  }
}

const SUPPORT_EMAIL = "hello@tidesofknowing.com";

function paymentConfirmationDeliveryLine(readingType: AskLeiliaDbReadingType): string {
  if (readingType === "one-question") {
    return "Your completed reading will be delivered as a professionally written PDF within 48 hours.";
  }

  return "Your completed reading will be delivered as a professionally written PDF within 48 hours. If your reading includes a private audio reflection or consultation, it will arrive alongside your written reading.";
}

export async function sendAskLeiliaCustomerPaymentConfirmation(
  input: {
    requestId: string;
    name: string;
    email: string;
    readingType: AskLeiliaDbReadingType;
  },
  locals?: unknown,
): Promise<void> {
  const pipelineFields = {
    requestId: input.requestId,
    customerEmail: input.email,
    readingType: input.readingType,
    requestStatus: "Paid",
  };

  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    const error = "EMAIL_API_KEY is not configured.";
    console.error("Ask Leilia customer payment confirmation skipped: EMAIL_API_KEY is not configured.", {
      requestId: input.requestId,
      email: input.email,
      readingType: input.readingType,
    });
    logAskLeiliaPipeline("CUSTOMER_EMAIL_FAILED", { ...pipelineFields, error });
    return;
  }

  const readingLabel = readingTypeLabel(input.readingType);
  const bodyLines = [
    `Hello ${input.name},`,
    "",
    "Thank you for your payment. Your Ask Leilia reading request has been received and confirmed.",
    "",
    `Reading purchased: ${readingLabel}`,
    "",
    "What happens next:",
    "",
    "I will now begin preparing your reading personally. Every Ask Leilia reading is completed entirely by me, without AI, and takes the time needed to understand both the cards and the story they are telling.",
    "",
    paymentConfirmationDeliveryLine(input.readingType),
    "",
    "If I need any clarification before I begin, I will be in touch by email.",
    "",
    `If you remember something important after submitting your request, simply reply to this email or write to ${SUPPORT_EMAIL} and include your name so I can add it to your reading before I begin.`,
    "",
    "Thank you for placing your trust in Ask Leilia.",
    "",
    "Warm regards,",
    "",
    "Leilia",
    "Tides of Knowing",
  ];

  const resend = new Resend(env.emailApiKey);
  const result = await resend.emails.send({
    from: "Leilia – Tides of Knowing <hello@tidesofknowing.com>",
    to: input.email,
    subject: "Your Ask Leilia reading request is confirmed",
    text: bodyLines.join("\n"),
  });

  if (result.error) {
    console.error("Ask Leilia customer payment confirmation failed:", {
      requestId: input.requestId,
      email: input.email,
      readingType: input.readingType,
      error: result.error,
    });
    logAskLeiliaPipeline("CUSTOMER_EMAIL_FAILED", {
      ...pipelineFields,
      error: result.error.message ?? "Resend send failed.",
    });
    return;
  }

  logAskLeiliaPipeline("CUSTOMER_EMAIL_SENT", pipelineFields);
}

export async function notifyAskLeiliaPaymentException(
  input: {
    requestId: string;
    customerName: string;
    customerEmail: string;
    readingType: AskLeiliaDbReadingType;
    expectedAmountCents: number;
    actualAmountCents: number;
    currency: string;
    paymentReference: string;
  },
  locals?: unknown,
): Promise<void> {
  const difference = input.actualAmountCents - input.expectedAmountCents;

  await sendAskLeiliaNotification(
    "URGENT: Ask Leilia payment exception",
    [
      "A Stripe payment completed but the amount did not match the reading type.",
      "",
      "Manual resolution is required before this request can proceed.",
      "",
      `Request id: ${input.requestId}`,
      `Name: ${input.customerName}`,
      `Email: ${input.customerEmail}`,
      `Reading type: ${readingTypeLabel(input.readingType)}`,
      `Expected amount: ${formatUsdCents(input.expectedAmountCents)}`,
      `Actual amount paid: ${formatUsdCents(input.actualAmountCents)}`,
      `Difference: ${formatUsdCents(difference)}`,
      `Currency: ${input.currency.toUpperCase()}`,
      `Stripe payment reference: ${input.paymentReference}`,
      "",
      "The payment has been recorded and linked. The request status is Payment Exception.",
      "Review in /ask-leilia/admin/ and resolve manually.",
    ],
    locals,
  );
}

export async function notifyAskLeiliaRequestSubmitted(
  input: {
    name: string;
    email: string;
    question: string;
  },
  locals?: unknown,
): Promise<void> {
  await sendAskLeiliaNotification(
    "New Ask Leilia request submitted",
    [
      "A paid Ask Leilia request has been submitted.",
      "",
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      "",
      "Question:",
      input.question,
    ],
    locals,
  );
}

export async function notifyAskLeiliaComplimentaryRequest(
  input: {
    name: string;
    email: string;
    question: string;
    context: string;
    cardPreference: AskLeiliaCardPreference;
    imageUrl: string | null;
  },
  locals?: unknown,
): Promise<void> {
  await sendAskLeiliaNotification(
    "Complimentary Ask Leilia invitation request",
    [
      "A complimentary reading request has been submitted through the Leilia Gift invitation page.",
      "",
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Reading type: ${readingTypeLabel("complimentary")}`,
      `Card preference: ${cardPreferenceLabel(input.cardPreference)}`,
      `Image uploaded: ${input.imageUrl ? "Yes" : "No"}`,
      "",
      "Question:",
      input.question,
      "",
      "Context:",
      input.context || "No additional context.",
    ],
    locals,
  );
}

export async function notifyAskLeiliaStatusChanged(
  input: {
    name: string;
    email: string;
    status: AskLeiliaStatus;
    readingType: AskLeiliaDbReadingType;
  },
  locals?: unknown,
): Promise<void> {
  await sendAskLeiliaNotification(
    "Ask Leilia request status updated",
    [
      "An Ask Leilia request status has been updated.",
      "",
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Reading type: ${readingTypeLabel(input.readingType)}`,
      `Status: ${input.status}`,
    ],
    locals,
  );
}

function escapeEmailText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAskLeiliaCustomerDelivery(
  input: {
    name: string;
    email: string;
    readingType?: AskLeiliaDbReadingType;
    pdfContentBase64: string;
    pdfFilename?: string;
    audioContentBase64?: string;
    isResend?: boolean;
  },
  locals?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    console.error("Ask Leilia customer delivery skipped: EMAIL_API_KEY is not configured.");
    return { ok: false, error: "Email is not configured." };
  }

  const readingLabel = input.readingType ? readingTypeLabel(input.readingType) : "Ask Leilia reading";
  const pdfFilename = input.pdfFilename?.endsWith(".pdf")
    ? input.pdfFilename
    : "Ask-Leilia-Reading.pdf";

  const bodyLines = [
    `Hello ${input.name},`,
    "",
    input.isResend
      ? "I am resending your completed Ask Leilia reading."
      : "Your personalised Ask Leilia reading has now been completed.",
    "",
    `Reading: ${readingLabel}`,
    "",
    "Your completed reading is attached as a PDF.",
  ];

  if (input.audioContentBase64) {
    bodyLines.push(
      "",
      "As I worked through your reading there were a number of additional thoughts and impressions that didn't naturally belong in the written interpretation. I've recorded them for you as a private audio reflection and attached it alongside your reading.",
    );
  }

  bodyLines.push(
    "",
    "Thank you for placing your trust in Ask Leilia.",
    "",
    `If you have any questions about your reading, reply to this email or write to ${SUPPORT_EMAIL}.`,
    "",
    "Warm regards,",
    "",
    "Leilia",
    "Tides of Knowing",
  );

  const attachments: { filename: string; content: string }[] = [
    {
      filename: pdfFilename,
      content: input.pdfContentBase64,
    },
  ];

  if (input.audioContentBase64) {
    attachments.push({
      filename: "Ask-Leilia-Audio-Reflection.mp3",
      content: input.audioContentBase64,
    });
  }

  const htmlParts = [
    `<p>Hello ${escapeEmailText(input.name)},</p>`,
    `<p>${
      input.isResend
        ? "I am resending your completed Ask Leilia reading."
        : "Your personalised Ask Leilia reading has now been completed."
    }</p>`,
    `<p>Reading: <strong>${escapeEmailText(readingLabel)}</strong></p>`,
    "<p>Your completed reading is attached as a PDF.</p>",
  ];

  if (input.audioContentBase64) {
    htmlParts.push(
      "<p>As I worked through your reading there were a number of additional thoughts and impressions that didn't naturally belong in the written interpretation. I've recorded them for you as a private audio reflection and attached it alongside your reading.</p>",
    );
  }

  htmlParts.push(
    "<p>Thank you for placing your trust in Ask Leilia.</p>",
    `<p>If you have any questions about your reading, reply to this email or write to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`,
    "<p>Warm regards,</p>",
    "<p>Leilia<br />Tides of Knowing</p>",
  );

  const resend = new Resend(env.emailApiKey);
  const result = await resend.emails.send({
    from: "Leilia – Tides of Knowing <hello@tidesofknowing.com>",
    to: input.email,
    subject: input.isResend
      ? "Your Ask Leilia reading (resent)"
      : "Your Ask Leilia reading is ready",
    text: bodyLines.join("\n"),
    html: htmlParts.join("\n"),
    attachments,
  });

  if (result.error) {
    console.error("Ask Leilia customer delivery failed:", result.error);
    return { ok: false, error: "Unable to send the delivery email." };
  }

  return { ok: true };
}

export async function sendAskLeiliaReviewRequest(
  input: {
    name: string;
    email: string;
    readingType: AskLeiliaDbReadingType;
    reviewUrl: string;
  },
  locals?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    console.error("Ask Leilia review request skipped: EMAIL_API_KEY is not configured.");
    return { ok: false, error: "Email is not configured." };
  }

  const readingLabel = readingTypeLabel(input.readingType);
  const safeReviewUrl = escapeEmailText(input.reviewUrl);

  const bodyLines = [
    `Hello ${input.name},`,
    "",
    "I hope you have had a little time with your Ask Leilia reading.",
    "",
    `Reading: ${readingLabel}`,
    "",
    "If you would like to share how the reading landed for you, you can leave a short review using the private link below. Your feedback helps other Seekers understand what an Ask Leilia reading offers.",
    "",
    `Share your experience: ${input.reviewUrl}`,
    "",
    "This link is unique to your reading and can only be used once.",
    "",
    "Warm regards,",
    "",
    "Leilia",
    "Tides of Knowing",
  ];

  const htmlParts = [
    `<p>Hello ${escapeEmailText(input.name)},</p>`,
    "<p>I hope you have had a little time with your Ask Leilia reading.</p>",
    `<p>Reading: <strong>${escapeEmailText(readingLabel)}</strong></p>`,
    "<p>If you would like to share how the reading landed for you, you can leave a short review using the private link below. Your feedback helps other Seekers understand what an Ask Leilia reading offers.</p>",
    `<p style="margin:20px 0;"><a href="${safeReviewUrl}" style="display:inline-block;padding:12px 18px;background:#1a3a4a;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">Share Your Experience</a></p>`,
    `<p style="font-size:14px;color:#555;">Or open this link: <a href="${safeReviewUrl}">${safeReviewUrl}</a></p>`,
    "<p>This link is unique to your reading and can only be used once.</p>",
    "<p>Warm regards,</p>",
    "<p>Leilia<br />Tides of Knowing</p>",
  ];

  const resend = new Resend(env.emailApiKey);
  const result = await resend.emails.send({
    from: "Leilia – Tides of Knowing <hello@tidesofknowing.com>",
    to: input.email,
    subject: "How was your Ask Leilia reading?",
    text: bodyLines.join("\n"),
    html: htmlParts.join("\n"),
  });

  if (result.error) {
    console.error("Ask Leilia review request email failed:", result.error);
    return { ok: false, error: "Unable to send the review request email." };
  }

  return { ok: true };
}
