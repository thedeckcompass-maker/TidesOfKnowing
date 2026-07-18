import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../../lib/community/auth";
import { json } from "../../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../../lib/community/supabaseServer";
import {
  authorisedSampleDraftFromForm,
  getAuthorisedSampleById,
  removeAuthorisedSamplePdfObject,
  uploadAuthorisedSamplePdf,
  upsertAuthorisedSample,
  validateAuthorisedSampleDraft,
} from "../../../../../lib/readingLibrary";

export const prerender = false;

const SAMPLES_PATH = "/ask-leilia/admin/samples/";

function redirectSamples(status: "saved" | "error", message: string): Response {
  const params = new URLSearchParams(
    status === "saved" ? { sample_saved: "1" } : { sample_error: message },
  );
  return new Response(null, {
    status: 303,
    headers: { Location: `${SAMPLES_PATH}?${params.toString()}` },
  });
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const idParam = params.id?.trim();
  if (!idParam) {
    return json({ ok: false, error: "Missing sample id." }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const isCreate = idParam === "new";

  const existing = isCreate ? null : await getAuthorisedSampleById(service, idParam);
  if (!isCreate && !existing) {
    return redirectSamples("error", "Authorised sample not found.");
  }

  const form = await request.formData();

  // Editorial pre-validation (never gates on PDF/consent) so we do not upload a
  // PDF for an otherwise invalid draft.
  const preDraft = authorisedSampleDraftFromForm(form, {
    samplePdfStoragePath: existing?.samplePdfStoragePath ?? null,
  });
  const preValidation = validateAuthorisedSampleDraft({ ...preDraft, isPublished: false });
  if (!preValidation.ok) {
    return redirectSamples("error", preValidation.error);
  }

  // Optional private PDF upload into the existing private bucket.
  let uploadedPath: string | null = null;
  const samplePdf = form.get("samplePdf");
  if (samplePdf instanceof File && samplePdf.size > 0) {
    const upload = await uploadAuthorisedSamplePdf(service, preDraft.slug, samplePdf);
    if ("error" in upload) {
      return redirectSamples("error", upload.error);
    }
    uploadedPath = upload.samplePdfStoragePath;
  }

  const effectivePath = uploadedPath ?? existing?.samplePdfStoragePath ?? null;
  const draft = { ...preDraft, samplePdfStoragePath: effectivePath };

  const validation = validateAuthorisedSampleDraft(draft);
  if (!validation.ok) {
    // Roll back a freshly uploaded object if the full draft is invalid.
    if (uploadedPath) await removeAuthorisedSamplePdfObject(service, uploadedPath);
    return redirectSamples("error", validation.error);
  }

  const result = await upsertAuthorisedSample(service, {
    id: existing?.id ?? null,
    draft,
    existingPublishedAt: existing?.publishedAt ?? null,
  });

  if (!result.ok) {
    if (uploadedPath) await removeAuthorisedSamplePdfObject(service, uploadedPath);
    return redirectSamples("error", result.error);
  }

  // Clean up the superseded PDF object after a successful replacement.
  if (
    uploadedPath &&
    existing?.samplePdfStoragePath &&
    existing.samplePdfStoragePath !== uploadedPath
  ) {
    await removeAuthorisedSamplePdfObject(service, existing.samplePdfStoragePath);
  }

  return redirectSamples("saved", "");
};
