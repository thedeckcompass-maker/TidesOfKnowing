import type { AskLeiliaCardPreference, AskLeiliaStatus } from "./types";
import { ASK_LEILIA_STATUSES } from "./types";

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
