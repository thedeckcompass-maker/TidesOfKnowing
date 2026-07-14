import {
  parseAskLeiliaAdminSort,
  parseAskLeiliaAdminView,
  type AskLeiliaAdminSort,
  type AskLeiliaAdminView,
} from "./adminQueue";
import {
  deriveAskLeiliaFulfilmentStatus,
  isAskLeiliaEffectivelyPaid,
  resolveReviewWorkflowStatus,
  type AskLeiliaFulfilmentStatus,
} from "./fulfilment";
import type { AskLeiliaDbReadingType } from "./readingTypes";
import type { AskLeiliaRequest } from "./types";

export type { AskLeiliaAdminView };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const REQUEST_SELECT = [
  "id",
  "payment_id",
  "created_at",
  "name",
  "email",
  "question",
  "context",
  "card_preference",
  "image_url",
  "reading_type",
  "status",
  "admin_notes",
  "updated_at",
  "delivered_at",
  "delivery_pdf_path",
  "delivery_sent_at",
  "payment_expected_amount",
  "payment_actual_amount",
  "payment_exception_reference",
  "archived_at",
  "archived_by",
  "started_at",
  "delivered_to",
  "delivery_method",
  "manually_delivered",
  "delivery_note",
  "delivery_pdf_filename",
  "delivery_pdf_uploaded_at",
  "delivery_pdf_size_bytes",
  "delivery_attempt_count",
  "last_resent_at",
  "review_status",
  "review_requested_at",
  "review_request_recipient",
  "linked_review_id",
  "manually_marked_paid",
  "manual_payment_method",
  "manual_payment_reference",
  "manual_payment_note",
  "manual_payment_recorded_at",
  "manual_payment_recorded_by",
  "manual_payment_reversed_at",
  "manual_payment_reversed_by",
  "payment:ask_leilia_payments(payment_status, amount, currency, stripe_payment_intent)",
].join(", ");

export type GetAskLeiliaRequestsOptions = {
  readingType?: AskLeiliaDbReadingType | "all";
  sort?: AskLeiliaAdminSort;
  view?: AskLeiliaAdminView;
  search?: string;
};

export type AskLeiliaQueueCounts = {
  unpaid: number;
  new: number;
  in_progress: number;
  ready_to_send: number;
  reviews_outstanding: number;
  delivered: number;
  review_provided: number;
  archived: number;
};

function normaliseRequest(
  row: AskLeiliaRequest & { payment?: AskLeiliaRequest["payment"] | AskLeiliaRequest["payment"][] },
): AskLeiliaRequest {
  return {
    ...row,
    archived_at: row.archived_at ?? null,
    archived_by: row.archived_by ?? null,
    started_at: row.started_at ?? null,
    delivered_to: row.delivered_to ?? null,
    delivery_method: row.delivery_method ?? null,
    manually_delivered: Boolean(row.manually_delivered),
    delivery_note: row.delivery_note ?? null,
    delivery_pdf_filename: row.delivery_pdf_filename ?? null,
    delivery_pdf_uploaded_at: row.delivery_pdf_uploaded_at ?? null,
    delivery_pdf_size_bytes: row.delivery_pdf_size_bytes ?? null,
    delivery_attempt_count: row.delivery_attempt_count ?? 0,
    last_resent_at: row.last_resent_at ?? null,
    review_status: row.review_status ?? "not_requested",
    review_requested_at: row.review_requested_at ?? null,
    review_request_recipient: row.review_request_recipient ?? null,
    linked_review_id: row.linked_review_id ?? null,
    manually_marked_paid: Boolean(row.manually_marked_paid),
    manual_payment_method: row.manual_payment_method ?? null,
    manual_payment_reference: row.manual_payment_reference ?? null,
    manual_payment_note: row.manual_payment_note ?? null,
    manual_payment_recorded_at: row.manual_payment_recorded_at ?? null,
    manual_payment_recorded_by: row.manual_payment_recorded_by ?? null,
    manual_payment_reversed_at: row.manual_payment_reversed_at ?? null,
    manual_payment_reversed_by: row.manual_payment_reversed_by ?? null,
    payment: first(row.payment as AskLeiliaRequest["payment"] | AskLeiliaRequest["payment"][]),
  };
}

function matchesView(request: AskLeiliaRequest, view: AskLeiliaAdminView): boolean {
  const fulfilment = deriveAskLeiliaFulfilmentStatus(request);
  const review = resolveReviewWorkflowStatus(request);
  const effectivelyPaid = isAskLeiliaEffectivelyPaid(request);

  switch (view) {
    case "active":
      // All non-archived questionnaires — paid and unpaid.
      return !request.archived_at;
    case "unpaid":
      return !request.archived_at && !effectivelyPaid;
    case "paid":
      return !request.archived_at && effectivelyPaid;
    case "new":
      return !request.archived_at && fulfilment === "new";
    case "in_progress":
      return !request.archived_at && fulfilment === "in_progress";
    case "ready_to_send":
      return !request.archived_at && fulfilment === "ready_to_send";
    case "delivered":
      return !request.archived_at && fulfilment === "delivered";
    case "review_outstanding":
      return (
        !request.archived_at &&
        fulfilment === "delivered" &&
        (review === "not_requested" || review === "requested")
      );
    case "review_provided":
      return !request.archived_at && review === "provided";
    case "archived":
      return Boolean(request.archived_at);
    default:
      return true;
  }
}

function matchesSearch(request: AskLeiliaRequest, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return request.name.toLowerCase().includes(q) || request.email.toLowerCase().includes(q);
}

export async function getAskLeiliaRequests(
  service: import("@supabase/supabase-js").SupabaseClient,
  options?: GetAskLeiliaRequestsOptions,
): Promise<AskLeiliaRequest[]> {
  const sort = parseAskLeiliaAdminSort(options?.sort);
  const view = parseAskLeiliaAdminView(options?.view);
  const search = typeof options?.search === "string" ? options.search.trim() : "";

  let query = service
    .from("ask_leilia_requests")
    .select(REQUEST_SELECT)
    .order("created_at", { ascending: sort === "oldest" })
    .order("id", { ascending: true })
    .limit(300);

  // All submitted questionnaires (including Pending Payment / Payment Exception).
  // No paid-only server filter — unpaid rows remain visible.

  if (options?.readingType && options.readingType !== "all") {
    query = query.eq("reading_type", options.readingType);
  }

  if (view === "archived") {
    query = query.not("archived_at", "is", null);
  } else {
    query = query.is("archived_at", null);
  }

  if (view === "delivered" || view === "review_outstanding") {
    query = query.eq("status", "Delivered");
  } else if (view === "review_provided") {
    query = query.eq("review_status", "provided");
  } else if (view === "in_progress") {
    query = query.eq("status", "In Progress").is("delivery_pdf_path", null);
  } else if (view === "ready_to_send") {
    query = query
      .in("status", ["Paid", "In Progress", "Pending Payment", "Payment Exception"])
      .not("delivery_pdf_path", "is", null)
      .neq("status", "Delivered");
  }

  if (search) {
    const escaped = search.replace(/[%_,]/g, " ").replace(/"/g, "");
    query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to load Ask Leilia requests:", error);
    return [];
  }

  const mapped = ((data ?? []) as AskLeiliaRequest[]).map((row) => normaliseRequest(row));

  return mapped.filter((request) => matchesView(request, view) && matchesSearch(request, search));
}

export async function getAskLeiliaQueueCounts(
  service: import("@supabase/supabase-js").SupabaseClient,
): Promise<AskLeiliaQueueCounts> {
  const { data, error } = await service
    .from("ask_leilia_requests")
    .select(
      "id, status, payment_id, archived_at, delivery_pdf_path, delivered_at, delivery_sent_at, manually_delivered, last_resent_at, review_status, linked_review_id, reading_type, manually_marked_paid, manual_payment_method, manual_payment_reference, manual_payment_note, manual_payment_recorded_at, manual_payment_recorded_by, manual_payment_reversed_at, manual_payment_reversed_by, payment:ask_leilia_payments(payment_status, amount, currency, stripe_payment_intent)",
    )
    .limit(1000);

  const empty: AskLeiliaQueueCounts = {
    unpaid: 0,
    new: 0,
    in_progress: 0,
    ready_to_send: 0,
    reviews_outstanding: 0,
    delivered: 0,
    review_provided: 0,
    archived: 0,
  };

  if (error) {
    console.error("Unable to load Ask Leilia queue counts:", error);
    return empty;
  }

  for (const row of (data ?? []) as AskLeiliaRequest[]) {
    const request = normaliseRequest(row);
    const fulfilment = deriveAskLeiliaFulfilmentStatus(request) as AskLeiliaFulfilmentStatus;
    const review = resolveReviewWorkflowStatus(request);

    if (request.archived_at) {
      empty.archived += 1;
      continue;
    }

    if (!isAskLeiliaEffectivelyPaid(request)) empty.unpaid += 1;
    if (fulfilment === "new") empty.new += 1;
    if (fulfilment === "in_progress") empty.in_progress += 1;
    if (fulfilment === "ready_to_send") empty.ready_to_send += 1;
    if (fulfilment === "delivered") empty.delivered += 1;
    if (review === "provided") empty.review_provided += 1;
    if (
      fulfilment === "delivered" &&
      (review === "not_requested" || review === "requested")
    ) {
      empty.reviews_outstanding += 1;
    }
  }

  return empty;
}

export async function getAskLeiliaUploadUrl(
  service: import("@supabase/supabase-js").SupabaseClient,
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
  service: import("@supabase/supabase-js").SupabaseClient,
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
