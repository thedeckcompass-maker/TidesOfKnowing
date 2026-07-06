import { Resend } from "resend";
import { communityEnv } from "../community/env";
import { formatUsdCents } from "./paymentAmounts";
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
): Promise<void> {
  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    console.error("Ask Leilia notification skipped: EMAIL_API_KEY is not configured.");
    return;
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
  }
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

  await sendAskLeiliaNotification(
    input.request ? "Ask Leilia request paid" : "Ask Leilia payment completed",
    [
      "An Ask Leilia payment has completed.",
      "",
      `Customer email: ${input.customerEmail}`,
      `Amount: ${input.amount} ${input.currency.toUpperCase()}`,
      `Stripe payment intent: ${input.paymentIntent}`,
      ...requestLines,
    ],
    locals,
  );
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

export async function sendAskLeiliaCustomerDelivery(
  input: {
    name: string;
    email: string;
    pdfContentBase64: string;
    audioContentBase64?: string;
  },
  locals?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    console.error("Ask Leilia customer delivery skipped: EMAIL_API_KEY is not configured.");
    return { ok: false, error: "Email is not configured." };
  }

  const bodyLines = [
    `Hello ${input.name},`,
    "",
    "Your personalised Ask Leilia reading has now been completed.",
    "",
    "Your reading is attached.",
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
    "Warm regards,",
    "",
    "Leilia",
    "Tides of Knowing",
  );

  const attachments: { filename: string; content: string }[] = [
    {
      filename: "Ask-Leilia-Reading.pdf",
      content: input.pdfContentBase64,
    },
  ];

  if (input.audioContentBase64) {
    attachments.push({
      filename: "Ask-Leilia-Audio-Reflection.mp3",
      content: input.audioContentBase64,
    });
  }

  const resend = new Resend(env.emailApiKey);
  const result = await resend.emails.send({
    from: "Leilia – Tides of Knowing <hello@tidesofknowing.com>",
    to: input.email,
    subject: "Your Ask Leilia reading is ready",
    text: bodyLines.join("\n"),
    attachments,
  });

  if (result.error) {
    console.error("Ask Leilia customer delivery failed:", result.error);
    return { ok: false, error: "Unable to send the delivery email." };
  }

  return { ok: true };
}
