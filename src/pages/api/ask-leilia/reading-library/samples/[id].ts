import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../../lib/community/auth";
import { json } from "../../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../../lib/community/supabaseServer";
import {
  authorisedSampleDraftFromForm,
  getAuthorisedSampleById,
  getAuthorisedSampleBySlug,
  getReadingLibraryPath,
  removeAuthorisedSamplePdfObject,
  uploadAuthorisedSamplePdf,
  upsertAuthorisedSample,
  validateAuthorisedSampleDraft,
  type ReadingLibraryAdminPublication,
} from "../../../../../lib/readingLibrary";

export const prerender = false;

const SAMPLES_PATH = "/ask-leilia/admin/samples/";

/** True when the caller (our fetch-based admin UI) wants a JSON result. */
function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

/** No-JS fallback: redirect back to the admin page with a status flag. */
function redirectSamples(status: "saved" | "error", message: string): Response {
  const params = new URLSearchParams(
    status === "saved" ? { sample_saved: "1" } : { sample_error: message },
  );
  return new Response(null, {
    status: 303,
    headers: { Location: `${SAMPLES_PATH}?${params.toString()}` },
  });
}

/** Success response for both transports. */
function success(
  request: Request,
  sample: ReadingLibraryAdminPublication,
): Response {
  if (!wantsJson(request)) return redirectSamples("saved", "");
  return json({
    ok: true,
    published: sample.isPublished,
    id: sample.id,
    slug: sample.slug,
    editAction: `/api/ask-leilia/reading-library/samples/${sample.id}/`,
    viewUrl: sample.isPublished ? getReadingLibraryPath(sample.slug) : null,
    hasPdf: Boolean(sample.samplePdfStoragePath),
    consentConfirmed: Boolean(sample.sampleConsentConfirmedAt),
  });
}

/** Error response for both transports. */
function failure(request: Request, message: string, statusCode = 400): Response {
  if (!wantsJson(request)) return redirectSamples("error", message);
  return json({ ok: false, error: message }, statusCode);
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

  let existing = isCreate ? null : await getAuthorisedSampleById(service, idParam);
  if (!isCreate && !existing) {
    return failure(request, "Authorised sample not found.", 404);
  }

  const form = await request.formData();

  // Publication is driven by which button was pressed (intent), never by a
  // client-set publication flag. "publish" runs the full publish gates; any
  // other value saves an unpublished draft.
  const wantsPublish = String(form.get("intent") ?? "").trim() === "publish";

  // Editorial pre-validation (never gates on PDF/consent) so we do not upload a
  // PDF for an otherwise invalid draft.
  const preDraft = authorisedSampleDraftFromForm(form, {
    samplePdfStoragePath: existing?.samplePdfStoragePath ?? null,
  });
  const preValidation = validateAuthorisedSampleDraft({ ...preDraft, isPublished: false });
  if (!preValidation.ok) {
    return failure(request, preValidation.error);
  }

  // Idempotent create: if a sample already exists with this (unique) slug,
  // update it in place rather than inserting a duplicate or hitting the
  // unique-slug constraint on a retry.
  if (isCreate) {
    const bySlug = await getAuthorisedSampleBySlug(service, preDraft.slug);
    if (bySlug) existing = bySlug;
  }

  // Optional private PDF upload into the existing private bucket.
  let uploadedPath: string | null = null;
  const samplePdf = form.get("samplePdf");
  if (samplePdf instanceof File && samplePdf.size > 0) {
    const upload = await uploadAuthorisedSamplePdf(service, preDraft.slug, samplePdf);
    if ("error" in upload) {
      return failure(request, upload.error);
    }
    uploadedPath = upload.samplePdfStoragePath;
  }

  // Keep the existing PDF attached unless a replacement was uploaded.
  const effectivePath = uploadedPath ?? existing?.samplePdfStoragePath ?? null;
  const draft = { ...preDraft, samplePdfStoragePath: effectivePath, isPublished: wantsPublish };

  const validation = validateAuthorisedSampleDraft(draft);
  if (!validation.ok) {
    // Roll back a freshly uploaded object if the full draft is invalid.
    if (uploadedPath) await removeAuthorisedSamplePdfObject(service, uploadedPath);
    return failure(request, validation.error);
  }

  const result = await upsertAuthorisedSample(service, {
    id: existing?.id ?? null,
    draft,
    existingPublishedAt: existing?.publishedAt ?? null,
  });

  if (!result.ok) {
    if (uploadedPath) await removeAuthorisedSamplePdfObject(service, uploadedPath);
    return failure(request, result.error);
  }

  // Clean up the superseded PDF object after a successful replacement.
  if (
    uploadedPath &&
    existing?.samplePdfStoragePath &&
    existing.samplePdfStoragePath !== uploadedPath
  ) {
    await removeAuthorisedSamplePdfObject(service, existing.samplePdfStoragePath);
  }

  return success(request, result.publication);
};
