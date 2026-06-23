import type { SupabaseClient } from "@supabase/supabase-js";
import type { AskLeiliaRequest } from "./types";

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getAskLeiliaRequests(
  service: SupabaseClient,
): Promise<AskLeiliaRequest[]> {
  const { data, error } = await service
    .from("ask_leilia_requests")
    .select(
      "id, payment_id, created_at, name, email, question, context, card_preference, image_url, status, admin_notes, updated_at, delivered_at, payment:ask_leilia_payments(payment_status, amount, currency)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Unable to load Ask Leilia requests:", error);
    return [];
  }

  return ((data ?? []) as (AskLeiliaRequest & { payment?: AskLeiliaRequest["payment"][] })[]).map(
    (request) => ({
      ...request,
      payment: first(request.payment),
    }),
  );
}

export async function getAskLeiliaUploadUrl(
  service: SupabaseClient,
  imageUrl: string | null,
): Promise<string | null> {
  if (!imageUrl) return null;

  const { data, error } = await service.storage
    .from("ask-leilia-uploads")
    .createSignedUrl(imageUrl, 60 * 10);

  if (error) {
    console.error("Unable to create Ask Leilia upload URL:", error);
    return null;
  }

  return data.signedUrl;
}
