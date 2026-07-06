import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { json } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { readingTypeLabel, isAskLeiliaDbReadingType } from "../../../../lib/ask-leilia/readingTypes";
import {
  getLibraryPublicationByRequestId,
  readingLibraryDraftFromForm,
  upsertLibraryPublication,
  validateReadingLibraryDraft,
} from "../../../../lib/readingLibrary";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const requestId = params.requestId;
  if (!requestId) {
    return json({ ok: false, error: "Missing request id." }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const form = await request.formData();
  const draft = readingLibraryDraftFromForm(form);
  const validation = validateReadingLibraryDraft(draft);

  if (!validation.ok) {
    return redirect(
      `/ask-leilia/admin/?library_error=${encodeURIComponent(validation.error)}`,
      303,
    );
  }

  const { data: askRequest, error: requestError } = await service
    .from("ask_leilia_requests")
    .select("id, status, question, reading_type, delivery_pdf_path")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !askRequest) {
    console.error("Unable to load Ask Leilia request for library publish:", requestError);
    return json({ ok: false, error: "Unable to save the library publication." }, 500);
  }

  if (askRequest.status !== "Delivered") {
    return redirect(
      `/ask-leilia/admin/?library_error=${encodeURIComponent("Only delivered readings can be added to the Reading Library.")}`,
      303,
    );
  }

  const existing = await getLibraryPublicationByRequestId(service, requestId);

  if (!isAskLeiliaDbReadingType(askRequest.reading_type)) {
    return json({ ok: false, error: "Request has an invalid reading type." }, 500);
  }

  const readingType = readingTypeLabel(askRequest.reading_type);

  const result = await upsertLibraryPublication(service, {
    requestId,
    question: askRequest.question,
    readingType,
    deliveryPdfPath: askRequest.delivery_pdf_path,
    draft,
    existingPublishedAt: existing?.publishedAt ?? null,
  });

  if (!result.ok) {
    return redirect(
      `/ask-leilia/admin/?library_error=${encodeURIComponent(result.error)}`,
      303,
    );
  }

  return redirect("/ask-leilia/admin/?library_saved=1", 303);
};
