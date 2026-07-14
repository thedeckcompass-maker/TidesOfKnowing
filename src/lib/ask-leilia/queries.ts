import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseAskLeiliaAdminSort,
  parseAskLeiliaArchiveFilter,
  type AskLeiliaAdminSort,
  type AskLeiliaArchiveFilter,
} from "./adminQueue";
import type { AskLeiliaDbReadingType } from "./readingTypes";
import type { AskLeiliaRequest } from "./types";

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const REQUEST_SELECT =
  "id, payment_id, created_at, name, email, question, context, card_preference, image_url, reading_type, status, admin_notes, updated_at, delivered_at, delivery_pdf_path, delivery_sent_at, payment_expected_amount, payment_actual_amount, payment_exception_reference, archived_at, archived_by, payment:ask_leilia_payments(payment_status, amount, currency, stripe_payment_intent)";

export type GetAskLeiliaRequestsOptions = {
  readingType?: AskLeiliaDbReadingType | "all";
  sort?: AskLeiliaAdminSort;
  archive?: AskLeiliaArchiveFilter;
};

export async function getAskLeiliaRequests(
  service: SupabaseClient,
  options?: GetAskLeiliaRequestsOptions,
): Promise<AskLeiliaRequest[]> {
  const sort = parseAskLeiliaAdminSort(options?.sort);
  const archive = parseAskLeiliaArchiveFilter(options?.archive);

  let query = service
    .from("ask_leilia_requests")
    .select(REQUEST_SELECT)
    .order("created_at", { ascending: sort === "oldest" })
    .order("id", { ascending: true })
    .limit(100);

  if (options?.readingType && options.readingType !== "all") {
    query = query.eq("reading_type", options.readingType);
  }

  if (archive === "active") {
    query = query.is("archived_at", null);
  } else if (archive === "archived") {
    query = query.not("archived_at", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to load Ask Leilia requests:", error);
    return [];
  }

  return ((data ?? []) as (AskLeiliaRequest & { payment?: AskLeiliaRequest["payment"][] })[]).map(
    (request) => ({
      ...request,
      archived_at: request.archived_at ?? null,
      archived_by: request.archived_by ?? null,
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

export async function getAskLeiliaDeliveryPdfUrl(
  service: SupabaseClient,
  deliveryPdfPath: string | null,
): Promise<string | null> {
  if (!deliveryPdfPath) return null;

  const { data, error } = await service.storage
    .from("ask-leilia-uploads")
    .createSignedUrl(deliveryPdfPath, 60 * 10);

  if (error) {
    console.error("Unable to create Ask Leilia delivery PDF URL:", error);
    return null;
  }

  return data.signedUrl;
}
