import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../../lib/community/auth";
import { json } from "../../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../../lib/community/supabaseServer";
import {
  ASK_LEILIA_ADMIN_DELIVERY_PDF_TTL_SECONDS,
  getAskLeiliaDeliveryPdfUrl,
} from "../../../../../lib/ask-leilia/queries";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals, url }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const requestId = params.id?.trim();
  if (!requestId) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const service = createCommunityServiceClient(locals);
  const { data, error } = await service
    .from("ask_leilia_requests")
    .select("delivery_pdf_path, delivery_pdf_filename")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load Ask Leilia request for delivery PDF:", error);
    return json({ ok: false, error: "Not found." }, 404);
  }

  const deliveryPdfPath =
    typeof data?.delivery_pdf_path === "string" ? data.delivery_pdf_path.trim() : "";
  if (!deliveryPdfPath) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const wantDownload = url.searchParams.get("download") === "1";
  const filename =
    typeof data?.delivery_pdf_filename === "string" && data.delivery_pdf_filename.trim()
      ? data.delivery_pdf_filename.trim()
      : "Ask-Leilia-Reading.pdf";

  const signedUrl = await getAskLeiliaDeliveryPdfUrl(
    service,
    deliveryPdfPath,
    ASK_LEILIA_ADMIN_DELIVERY_PDF_TTL_SECONDS,
    wantDownload ? { download: filename } : undefined,
  );

  if (!signedUrl) {
    return json({ ok: false, error: "Unable to load PDF." }, 500);
  }

  return Response.redirect(signedUrl, 302);
};
