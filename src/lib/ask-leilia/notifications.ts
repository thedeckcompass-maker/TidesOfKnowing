import { Resend } from "resend";
import { communityEnv } from "../community/env";
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
        "The customer should now complete the request form at /ask-leilia/request/.",
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

export async function notifyAskLeiliaStatusChanged(
  input: {
    name: string;
    email: string;
    status: AskLeiliaStatus;
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
      `Status: ${input.status}`,
    ],
    locals,
  );
}
