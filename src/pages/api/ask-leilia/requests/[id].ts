import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { json } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { downloadAskLeiliaDeliveryPdf, uploadAskLeiliaDeliveryPdf } from "../../../../lib/ask-leilia/delivery";
import {
  notifyAskLeiliaStatusChanged,
  sendAskLeiliaCustomerDelivery,
} from "../../../../lib/ask-leilia/notifications";
import { isAskLeiliaDbReadingType } from "../../../../lib/ask-leilia/readingTypes";
import type { AskLeiliaStatus } from "../../../../lib/ask-leilia/types";
import {
  adminSelectableStatuses,
  isAskLeiliaStatus,
  validateStatusTransition,
} from "../../../../lib/ask-leilia/validation";

export const prerender = false;

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
  const statusRaw = form.get("status");
  const submittedNotes = typeof form.get("notes") === "string" ? String(form.get("notes")).trim() : "";
  const deliveryPdf = form.get("deliveryPdf");

  if (!isAskLeiliaStatus(statusRaw)) {
    return json({ ok: false, error: "Invalid status." }, 400);
  }

  const { data: existing, error: fetchError } = await service
    .from("ask_leilia_requests")
    .select(
      "status, admin_notes, delivery_pdf_path, reading_type, name, email, delivery_sent_at, payment_expected_amount, payment_actual_amount, payment_exception_reference",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !existing) {
    console.error("Unable to load Ask Leilia request for update:", fetchError);
    return json({ ok: false, error: "Unable to update the request." }, 500);
  }

  const current = existing as {
    status: AskLeiliaStatus;
    admin_notes: string | null;
    delivery_pdf_path: string | null;
    reading_type: string;
    name: string;
    email: string;
    delivery_sent_at: string | null;
    payment_expected_amount: number | null;
    payment_actual_amount: number | null;
    payment_exception_reference: string | null;
  };

  if (!isAskLeiliaDbReadingType(current.reading_type)) {
    return json({ ok: false, error: "Request has an invalid reading type." }, 500);
  }

  let deliveryPdfPath = current.delivery_pdf_path;

  if (deliveryPdf instanceof File && deliveryPdf.size > 0) {
    const upload = await uploadAskLeiliaDeliveryPdf(service, requestId, deliveryPdf);
    if ("error" in upload) {
      return json({ ok: false, error: upload.error }, 400);
    }
    deliveryPdfPath = upload.deliveryPdfPath;
  }

  const transition = validateStatusTransition({
    currentStatus: current.status,
    nextStatus: statusRaw,
    hasDeliveryPdf: Boolean(deliveryPdfPath),
  });

  if (!transition.ok) {
    return json({ ok: false, error: transition.error }, 400);
  }

  const allowedStatuses = adminSelectableStatuses(current.status);
  if (!allowedStatuses.includes(statusRaw)) {
    return json({ ok: false, error: "That status change is not allowed." }, 400);
  }

  const now = new Date().toISOString();
  const shouldSendDeliveryEmail =
    statusRaw === "Delivered" && !current.delivery_sent_at && Boolean(deliveryPdfPath);
  let deliverySentAt = current.delivery_sent_at;

  if (shouldSendDeliveryEmail) {
    const claimTimestamp = now;
    const { data: claimed, error: claimError } = await service
      .from("ask_leilia_requests")
      .update({ delivery_sent_at: claimTimestamp })
      .eq("id", requestId)
      .is("delivery_sent_at", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Unable to claim Ask Leilia delivery send:", claimError);
      return json({ ok: false, error: "Unable to update the request." }, 500);
    }

    if (!claimed) {
      const { data: refreshed, error: refreshError } = await service
        .from("ask_leilia_requests")
        .select("delivery_sent_at, status")
        .eq("id", requestId)
        .maybeSingle();

      if (refreshError || !refreshed?.delivery_sent_at) {
        return json(
          { ok: false, error: "Delivery is already being processed. Please wait and refresh." },
          409,
        );
      }

      deliverySentAt = refreshed.delivery_sent_at;
    } else {
      const pdf = await downloadAskLeiliaDeliveryPdf(service, deliveryPdfPath);
      if ("error" in pdf) {
        await service
          .from("ask_leilia_requests")
          .update({ delivery_sent_at: null })
          .eq("id", requestId)
          .eq("delivery_sent_at", claimTimestamp);
        return json({ ok: false, error: pdf.error }, 500);
      }

      const delivery = await sendAskLeiliaCustomerDelivery(
        {
          name: current.name,
          email: current.email,
          pdfContentBase64: pdf.contentBase64,
        },
        locals,
      );

      if (!delivery.ok) {
        await service
          .from("ask_leilia_requests")
          .update({ delivery_sent_at: null })
          .eq("id", requestId)
          .eq("delivery_sent_at", claimTimestamp);
        return json({ ok: false, error: delivery.error }, 500);
      }

      deliverySentAt = claimTimestamp;
    }
  }

  const { data, error } = await service
    .from("ask_leilia_requests")
    .update({
      status: statusRaw,
      admin_notes: submittedNotes || current.admin_notes || null,
      delivery_pdf_path: deliveryPdfPath,
      delivered_at: statusRaw === "Delivered" ? now : null,
      delivery_sent_at: deliverySentAt,
      payment_expected_amount: statusRaw === "Paid" ? null : current.payment_expected_amount,
      payment_actual_amount: statusRaw === "Paid" ? null : current.payment_actual_amount,
      payment_exception_reference:
        statusRaw === "Paid" ? null : current.payment_exception_reference,
    })
    .eq("id", requestId)
    .select("name, email, status, reading_type")
    .single();

  if (error) {
    console.error("Unable to update Ask Leilia request:", error);
    return json({ ok: false, error: "Unable to update the request." }, 500);
  }

  if (data && statusRaw !== current.status) {
    const row = data as { name: string; email: string; status: AskLeiliaStatus; reading_type: string };
    if (isAskLeiliaDbReadingType(row.reading_type)) {
      await notifyAskLeiliaStatusChanged(
        {
          name: row.name,
          email: row.email,
          status: row.status,
          readingType: row.reading_type,
        },
        locals,
      );
    }
  }

  return redirect("/ask-leilia/admin/", 303);
};
