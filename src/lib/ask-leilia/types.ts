import type { AskLeiliaDbReadingType } from "./readingTypes";

export const ASK_LEILIA_STATUSES = [
  "Pending Payment",
  "Paid",
  "In Progress",
  "Delivered",
  "Payment Exception",
] as const;

export type AskLeiliaStatus = (typeof ASK_LEILIA_STATUSES)[number];

export const ASK_LEILIA_WORKFLOW_STATUSES = [
  "Pending Payment",
  "Paid",
  "In Progress",
  "Delivered",
] as const;

export type AskLeiliaCardPreference = "pull_for_me" | "own_cards_attached";

export type AskLeiliaPayment = {
  id: string;
  stripe_payment_intent: string;
  stripe_customer_id: string | null;
  customer_email: string;
  amount: number;
  currency: string;
  payment_status: string;
  stripe_metadata: Record<string, unknown>;
  created_at: string;
};

export type AskLeiliaRequest = {
  id: string;
  payment_id: string | null;
  created_at: string;
  name: string;
  email: string;
  question: string;
  context: string | null;
  card_preference: AskLeiliaCardPreference;
  image_url: string | null;
  reading_type: AskLeiliaDbReadingType;
  status: AskLeiliaStatus;
  admin_notes: string | null;
  updated_at: string;
  delivered_at: string | null;
  delivery_pdf_path: string | null;
  delivery_sent_at: string | null;
  payment_expected_amount: number | null;
  payment_actual_amount: number | null;
  payment_exception_reference: string | null;
  archived_at: string | null;
  archived_by: string | null;
  payment?: Pick<AskLeiliaPayment, "payment_status" | "amount" | "currency" | "stripe_payment_intent"> | null;
};

export function cardPreferenceLabel(value: AskLeiliaCardPreference): string {
  return value === "own_cards_attached"
    ? "I have attached my own cards"
    : "Please pull the cards for me";
}
