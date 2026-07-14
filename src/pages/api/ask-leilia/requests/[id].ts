import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { json } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import {
  downloadAskLeiliaDeliveryPdf,
  removeAskLeiliaDeliveryPdfObject,
  uploadAskLeiliaDeliveryPdf,
} from "../../../../lib/ask-leilia/delivery";
import {
  isAskLeiliaEffectivelyPaid,
  isAskLeiliaManualDeliveryMethod,
  type AskLeiliaManualDeliveryMethod,
  type AskLeiliaManualPaymentMethod,
} from "../../../../lib/ask-leilia/fulfilment";
import {
  notifyAskLeiliaStatusChanged,
  sendAskLeiliaCustomerDelivery,
  sendAskLeiliaReviewRequest,
} from "../../../../lib/ask-leilia/notifications";
import {
  buildAskLeiliaReviewUrl,
  ensureAskLeiliaReviewToken,
} from "../../../../lib/ask-leilia/reviews/queries";
import { parseAdminReturnPath } from "../../../../lib/ask-leilia/adminQueue";
import { isAskLeiliaDbReadingType } from "../../../../lib/ask-leilia/readingTypes";
import type { AskLeiliaStatus } from "../../../../lib/ask-leilia/types";
import {
  cleanText,
  statusAfterManualPaymentReversal,
  validateManualDelivery,
  validateMarkAsPaid,
  validateRemoveDeliveryPdf,
  validateRequestReview,
  validateResendDelivery,
  validateReverseManualPayment,
  validateStartReading,
  validateSystemDelivery,
  validateUploadDeliveryPdf,
} from "../../../../lib/ask-leilia/validation";
import { siteBase } from "../../../../lib/site";

export const prerender = false;

const REQUEST_FIELDS =
  "status, admin_notes, delivery_pdf_path, delivery_pdf_filename, delivery_pdf_uploaded_at, delivery_pdf_size_bytes, reading_type, name, email, delivery_sent_at, delivered_at, delivered_to, delivery_method, manually_delivered, delivery_note, delivery_attempt_count, last_resent_at, started_at, archived_at, review_status, review_requested_at, review_request_recipient, linked_review_id, payment_id, manually_marked_paid, manual_payment_method, manual_payment_reference, manual_payment_note, manual_payment_recorded_at, manual_payment_recorded_by, manual_payment_reversed_at, manual_payment_reversed_by, payment:ask_leilia_payments(payment_status, amount, currency, stripe_payment_intent)";

type RequestRow = {
  status: AskLeiliaStatus;
  admin_notes: string | null;
  delivery_pdf_path: string | null;
  delivery_pdf_filename: string | null;
  delivery_pdf_uploaded_at: string | null;
  delivery_pdf_size_bytes: number | null;
  reading_type: string;
  name: string;
  email: string;
  delivery_sent_at: string | null;
  delivered_at: string | null;
  delivered_to: string | null;
  delivery_method: string | null;
  manually_delivered: boolean;
  delivery_note: string | null;
  delivery_attempt_count: number;
  last_resent_at: string | null;
  started_at: string | null;
  archived_at: string | null;
  review_status: string;
  review_requested_at: string | null;
  review_request_recipient: string | null;
  linked_review_id: string | null;
  payment_id: string | null;
  manually_marked_paid: boolean;
  manual_payment_method: AskLeiliaManualPaymentMethod | null;
  manual_payment_reference: string | null;
  manual_payment_note: string | null;
  manual_payment_recorded_at: string | null;
  manual_payment_recorded_by: string | null;
  manual_payment_reversed_at: string | null;
  manual_payment_reversed_by: string | null;
  payment?: {
    payment_status: string;
    amount: number;
    currency: string;
    stripe_payment_intent: string;
  } | null;
};

function asPaymentFields(existing: RequestRow) {
  return {
    status: existing.status,
    payment_id: existing.payment_id,
    reading_type: existing.reading_type,
    manually_marked_paid: Boolean(existing.manually_marked_paid),
    manual_payment_method: existing.manual_payment_method,
    manual_payment_reference: existing.manual_payment_reference,
    manual_payment_note: existing.manual_payment_note,
    manual_payment_recorded_at: existing.manual_payment_recorded_at,
    manual_payment_recorded_by: existing.manual_payment_recorded_by,
    manual_payment_reversed_at: existing.manual_payment_reversed_at,
    payment: Array.isArray(existing.payment) ? existing.payment[0] ?? null : existing.payment ?? null,
  };
}

function redirectWithNotice(
  returnTo: string,
  notice: string,
  kind: "ok" | "error" = "ok",
): Response {
  const redirectUrl = new URL(returnTo, "https://www.tidesofknowing.com");
  for (const key of [
    "archived",
    "restored",
    "notice",
    "error",
    "started",
    "sent",
    "resent",
    "manual_delivered",
    "pdf_uploaded",
    "pdf_removed",
    "notes_saved",
    "review_requested",
    "marked_paid",
    "payment_reversed",
  ]) {
    redirectUrl.searchParams.delete(key);
  }
  redirectUrl.searchParams.set(kind === "ok" ? "notice" : "error", notice);
  return Response.redirect(`${redirectUrl.pathname}${redirectUrl.search}`, 303);
}

async function loadRequest(
  service: ReturnType<typeof createCommunityServiceClient>,
  requestId: string,
): Promise<RequestRow | null> {
  const { data, error } = await service
    .from("ask_leilia_requests")
    .select(REQUEST_FIELDS)
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to load Ask Leilia request for update:", error);
    return null;
  }

  const row = data as RequestRow;
  row.payment = Array.isArray(row.payment) ? row.payment[0] ?? null : row.payment ?? null;
  return row;
}

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const requestId = params.id;
  if (!requestId) {
    return json({ ok: false, error: "Missing request id." }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const form = await request.formData();
  const actionRaw = typeof form.get("action") === "string" ? String(form.get("action")) : "";
  const returnTo = parseAdminReturnPath(form.get("return_to"));

  if (actionRaw === "archive" || actionRaw === "restore") {
    const now = new Date().toISOString();
    const patch =
      actionRaw === "archive"
        ? { archived_at: now, archived_by: locals.profile.id }
        : { archived_at: null, archived_by: null };

    const { data, error } = await service
      .from("ask_leilia_requests")
      .update(patch)
      .eq("id", requestId)
      .select("id, status, archived_at")
      .maybeSingle();

    if (error || !data) {
      console.error("Unable to update Ask Leilia archive state:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(
      returnTo,
      actionRaw === "archive"
        ? "Reading archived. It remains fully recoverable."
        : "Reading restored to the active queue.",
    );
  }

  const existing = await loadRequest(service, requestId);
  if (!existing) {
    return json({ ok: false, error: "Unable to update the request." }, 500);
  }

  if (!isAskLeiliaDbReadingType(existing.reading_type)) {
    return json({ ok: false, error: "Request has an invalid reading type." }, 500);
  }

  const paymentFields = asPaymentFields(existing);
  const effectivelyPaid = isAskLeiliaEffectivelyPaid({
    ...paymentFields,
    reading_type: existing.reading_type,
  });
  const now = new Date().toISOString();

  if (actionRaw === "mark_as_paid") {
    const validation = validateMarkAsPaid({
      effectivelyPaid,
      method: form.get("manual_payment_method"),
      reference: form.get("manual_payment_reference"),
      note: form.get("manual_payment_note"),
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    const recordedAtRaw =
      typeof form.get("manual_payment_recorded_at") === "string"
        ? String(form.get("manual_payment_recorded_at")).trim()
        : "";
    let recordedAt = now;
    if (recordedAtRaw) {
      const parsed = new Date(recordedAtRaw);
      if (Number.isNaN(parsed.getTime())) {
        return redirectWithNotice(returnTo, "Enter a valid payment date and time.", "error");
      }
      recordedAt = parsed.toISOString();
    }

    const { error } = await service
      .from("ask_leilia_requests")
      .update({
        manually_marked_paid: true,
        manual_payment_method: validation.value.method,
        manual_payment_reference: validation.value.reference,
        manual_payment_note: validation.value.note,
        manual_payment_recorded_at: recordedAt,
        manual_payment_recorded_by: locals.profile.id,
        manual_payment_reversed_at: null,
        manual_payment_reversed_by: null,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to mark Ask Leilia request as paid manually:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(
      returnTo,
      "Manual payment recorded. The reading is now available for fulfilment.",
    );
  }

  if (actionRaw === "reverse_manual_payment") {
    const validation = validateReverseManualPayment({
      ...paymentFields,
      reading_type: existing.reading_type,
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    const nextStatus = statusAfterManualPaymentReversal({
      ...paymentFields,
      reading_type: existing.reading_type,
    });

    const { error } = await service
      .from("ask_leilia_requests")
      .update({
        manually_marked_paid: false,
        manual_payment_reversed_at: now,
        manual_payment_reversed_by: locals.profile.id,
        status: nextStatus,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to reverse Ask Leilia manual payment:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(
      returnTo,
      "Manual payment confirmation reversed. Stripe data was not changed.",
    );
  }

  if (actionRaw === "start_reading") {
    const validation = validateStartReading({
      status: existing.status,
      archivedAt: existing.archived_at,
      effectivelyPaid,
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    const { error } = await service
      .from("ask_leilia_requests")
      .update({
        status: "In Progress",
        started_at: existing.started_at ?? now,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to start Ask Leilia reading:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    await notifyAskLeiliaStatusChanged(
      {
        name: existing.name,
        email: existing.email,
        status: "In Progress",
        readingType: existing.reading_type,
      },
      locals,
    );

    return redirectWithNotice(returnTo, "Reading marked in progress.");
  }

  if (actionRaw === "save_notes") {
    const submittedNotes =
      typeof form.get("notes") === "string" ? String(form.get("notes")).trim() : "";
    const { error } = await service
      .from("ask_leilia_requests")
      .update({ admin_notes: submittedNotes || null })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to save Ask Leilia notes:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(returnTo, "Internal notes saved.");
  }

  if (actionRaw === "upload_pdf" || actionRaw === "replace_pdf") {
    const deliveryPdf = form.get("deliveryPdf");
    if (!(deliveryPdf instanceof File) || deliveryPdf.size < 1) {
      return redirectWithNotice(returnTo, "Please choose a PDF file to upload.", "error");
    }

    const uploadGate = validateUploadDeliveryPdf({
      archivedAt: existing.archived_at,
      effectivelyPaid,
    });
    if (!uploadGate.ok) {
      return redirectWithNotice(returnTo, uploadGate.error, "error");
    }

    const upload = await uploadAskLeiliaDeliveryPdf(service, requestId, deliveryPdf);
    if ("error" in upload) {
      return redirectWithNotice(returnTo, upload.error, "error");
    }

    if (existing.delivery_pdf_path && existing.delivery_pdf_path !== upload.deliveryPdfPath) {
      await removeAskLeiliaDeliveryPdfObject(service, existing.delivery_pdf_path);
    }

    const patch: Record<string, unknown> = {
      delivery_pdf_path: upload.deliveryPdfPath,
      delivery_pdf_filename: upload.deliveryPdfFilename,
      delivery_pdf_uploaded_at: upload.deliveryPdfUploadedAt,
      delivery_pdf_size_bytes: upload.deliveryPdfSizeBytes,
    };

    if (
      existing.status === "Paid" ||
      existing.status === "Pending Payment" ||
      existing.status === "Payment Exception"
    ) {
      patch.status = "In Progress";
      patch.started_at = existing.started_at ?? now;
    }

    const { error } = await service.from("ask_leilia_requests").update(patch).eq("id", requestId);
    if (error) {
      console.error("Unable to save Ask Leilia PDF metadata:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(returnTo, "Completed reading PDF uploaded.");
  }

  if (actionRaw === "remove_pdf") {
    const validation = validateRemoveDeliveryPdf({
      status: existing.status,
      hasDeliveryPdf: Boolean(existing.delivery_pdf_path),
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    if (existing.delivery_pdf_path) {
      await removeAskLeiliaDeliveryPdfObject(service, existing.delivery_pdf_path);
    }

    const patch: Record<string, unknown> = {
      delivery_pdf_path: null,
      delivery_pdf_filename: null,
      delivery_pdf_uploaded_at: null,
      delivery_pdf_size_bytes: null,
    };

    if (existing.status !== "Delivered") {
      patch.status =
        existing.started_at || existing.status === "In Progress" ? "In Progress" : "Paid";
    }

    const { error } = await service.from("ask_leilia_requests").update(patch).eq("id", requestId);
    if (error) {
      console.error("Unable to clear Ask Leilia PDF metadata:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(
      returnTo,
      "Completed reading PDF removed. Reading returned to In progress.",
    );
  }

  if (actionRaw === "send_delivery") {
    const validation = validateSystemDelivery({
      status: existing.status,
      archivedAt: existing.archived_at,
      hasDeliveryPdf: Boolean(existing.delivery_pdf_path),
      email: existing.email,
      effectivelyPaid,
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    const pdfPath = existing.delivery_pdf_path!;
    const claimTimestamp = now;
    const { data: claimed, error: claimError } = await service
      .from("ask_leilia_requests")
      .update({ delivery_sent_at: claimTimestamp })
      .eq("id", requestId)
      .in("status", ["Paid", "In Progress"])
      .is("delivery_sent_at", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Unable to claim Ask Leilia delivery send:", claimError);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    if (!claimed) {
      return redirectWithNotice(
        returnTo,
        "Delivery is already being processed, or this reading was already delivered.",
        "error",
      );
    }

    const pdf = await downloadAskLeiliaDeliveryPdf(service, pdfPath);
    if ("error" in pdf) {
      await service
        .from("ask_leilia_requests")
        .update({ delivery_sent_at: null })
        .eq("id", requestId)
        .eq("delivery_sent_at", claimTimestamp);
      return redirectWithNotice(returnTo, pdf.error, "error");
    }

    const delivery = await sendAskLeiliaCustomerDelivery(
      {
        name: existing.name,
        email: existing.email,
        readingType: existing.reading_type,
        pdfContentBase64: pdf.contentBase64,
        pdfFilename: existing.delivery_pdf_filename ?? undefined,
      },
      locals,
    );

    if (!delivery.ok) {
      await service
        .from("ask_leilia_requests")
        .update({ delivery_sent_at: null })
        .eq("id", requestId)
        .eq("delivery_sent_at", claimTimestamp);
      return redirectWithNotice(returnTo, delivery.error, "error");
    }

    const { error } = await service
      .from("ask_leilia_requests")
      .update({
        status: "Delivered",
        delivered_at: claimTimestamp,
        delivery_sent_at: claimTimestamp,
        delivered_to: existing.email,
        delivery_method: "system_email",
        manually_delivered: false,
        delivery_attempt_count: (existing.delivery_attempt_count || 0) + 1,
        started_at: existing.started_at ?? claimTimestamp,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to mark Ask Leilia reading delivered:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    await notifyAskLeiliaStatusChanged(
      {
        name: existing.name,
        email: existing.email,
        status: "Delivered",
        readingType: existing.reading_type,
      },
      locals,
    );

    return redirectWithNotice(returnTo, "Reading emailed to the client and marked delivered.");
  }

  if (actionRaw === "resend_delivery") {
    const validation = validateResendDelivery({
      status: existing.status,
      hasDeliveryPdf: Boolean(existing.delivery_pdf_path),
      email: existing.email,
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    const pdf = await downloadAskLeiliaDeliveryPdf(service, existing.delivery_pdf_path!);
    if ("error" in pdf) {
      return redirectWithNotice(returnTo, pdf.error, "error");
    }

    const delivery = await sendAskLeiliaCustomerDelivery(
      {
        name: existing.name,
        email: existing.email,
        readingType: existing.reading_type,
        pdfContentBase64: pdf.contentBase64,
        pdfFilename: existing.delivery_pdf_filename ?? undefined,
        isResend: true,
      },
      locals,
    );

    if (!delivery.ok) {
      return redirectWithNotice(returnTo, delivery.error, "error");
    }

    const { error } = await service
      .from("ask_leilia_requests")
      .update({
        last_resent_at: now,
        delivery_sent_at: existing.delivery_sent_at ?? now,
        delivered_to: existing.email,
        delivery_attempt_count: (existing.delivery_attempt_count || 0) + 1,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to record Ask Leilia resend:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(returnTo, "Reading resent to the client.");
  }

  if (actionRaw === "mark_delivered_manual") {
    const validation = validateManualDelivery({
      status: existing.status,
      archivedAt: existing.archived_at,
      effectivelyPaid,
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    const methodRaw = form.get("delivery_method");
    if (!isAskLeiliaManualDeliveryMethod(methodRaw)) {
      return redirectWithNotice(returnTo, "Choose a manual delivery method.", "error");
    }
    const method = methodRaw as AskLeiliaManualDeliveryMethod;

    const deliveredAtRaw =
      typeof form.get("delivered_at") === "string" ? String(form.get("delivered_at")).trim() : "";
    let deliveredAt = now;
    if (deliveredAtRaw) {
      const parsed = new Date(deliveredAtRaw);
      if (Number.isNaN(parsed.getTime())) {
        return redirectWithNotice(returnTo, "Enter a valid delivery date and time.", "error");
      }
      deliveredAt = parsed.toISOString();
    }

    const deliveryNote = cleanText(form.get("delivery_note")).slice(0, 2000) || null;

    const { error } = await service
      .from("ask_leilia_requests")
      .update({
        status: "Delivered",
        delivered_at: deliveredAt,
        delivered_to: existing.email,
        delivery_method: method,
        manually_delivered: true,
        delivery_note: deliveryNote,
        started_at: existing.started_at ?? deliveredAt,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to manually mark Ask Leilia delivered:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    await notifyAskLeiliaStatusChanged(
      {
        name: existing.name,
        email: existing.email,
        status: "Delivered",
        readingType: existing.reading_type,
      },
      locals,
    );

    return redirectWithNotice(returnTo, "Reading manually marked as delivered.");
  }

  if (actionRaw === "request_review" || actionRaw === "resend_review_request") {
    const validation = validateRequestReview({
      status: existing.status,
      reviewStatus: existing.review_status,
      linkedReviewId: existing.linked_review_id,
    });
    if (!validation.ok) {
      return redirectWithNotice(returnTo, validation.error, "error");
    }

    if (actionRaw === "request_review" && existing.review_status === "requested") {
      return redirectWithNotice(
        returnTo,
        "A review has already been requested. Use Resend review request to send again.",
        "error",
      );
    }

    const tokenResult = await ensureAskLeiliaReviewToken(service, requestId);
    if (!tokenResult.ok) {
      return redirectWithNotice(returnTo, tokenResult.error, "error");
    }

    const origin = siteBase({ site: undefined, url: new URL(request.url) }).origin;
    const reviewUrl = buildAskLeiliaReviewUrl(
      { site: undefined, url: new URL(origin) },
      tokenResult.token,
    );

    const sent = await sendAskLeiliaReviewRequest(
      {
        name: existing.name,
        email: existing.email,
        readingType: existing.reading_type,
        reviewUrl,
      },
      locals,
    );

    if (!sent.ok) {
      return redirectWithNotice(returnTo, sent.error, "error");
    }

    const { error } = await service
      .from("ask_leilia_requests")
      .update({
        review_status: "requested",
        review_requested_at: now,
        review_request_recipient: existing.email,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Unable to record Ask Leilia review request:", error);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    return redirectWithNotice(
      returnTo,
      actionRaw === "resend_review_request"
        ? "Review request resent."
        : "Review request sent to the client.",
    );
  }

  void redirect;
  return redirectWithNotice(
    returnTo,
    "Unknown admin action. Use the fulfilment controls on the reading.",
    "error",
  );
};
