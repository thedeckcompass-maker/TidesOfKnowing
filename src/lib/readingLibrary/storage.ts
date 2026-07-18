import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "../../utils/slugify";

/**
 * Authorised sample PDFs reuse the existing private Supabase Storage bucket
 * (`ask-leilia-uploads`, non-public) under an auditable, sample-scoped prefix.
 * They are never copied to a public downloads location and their storage path
 * is never exposed in rendered HTML/JSON. Delivery is via the existing
 * signed-URL pattern (see getAskLeiliaDeliveryPdfUrl / the public PDF route).
 */
export const READING_LIBRARY_BUCKET = "ask-leilia-uploads";
export const READING_LIBRARY_SAMPLE_PREFIX = "reading-library-samples";

const MAX_PDF_BYTES = 12 * 1024 * 1024;

/**
 * Defensive slug normalisation for storage paths. Never trust the caller's slug
 * for a path segment: strip anything that is not a safe slug character so path
 * traversal (`..`, `/`, backslashes, NUL) is impossible even if a future caller
 * forgets to validate. Returns "" when nothing safe remains.
 */
export function safeSampleSlug(slug: string): string {
  return slugify(slug).slice(0, 80);
}

export function readingLibrarySamplePathPrefix(slug: string): string {
  return `${READING_LIBRARY_SAMPLE_PREFIX}/${safeSampleSlug(slug)}/`;
}

export async function uploadAuthorisedSamplePdf(
  service: SupabaseClient,
  slug: string,
  file: File,
): Promise<{ samplePdfStoragePath: string } | { error: string }> {
  const lowerName = file.name.toLowerCase();
  if (file.type && file.type !== "application/pdf") {
    return { error: "Please upload a PDF file." };
  }
  if (file.type !== "application/pdf" && !lowerName.endsWith(".pdf")) {
    return { error: "Please upload a PDF file." };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { error: "Please keep PDF uploads under 12 MB." };
  }
  if (file.size < 1) {
    return { error: "The uploaded PDF is empty." };
  }

  const safeSlug = safeSampleSlug(slug);
  if (!safeSlug) {
    return { error: "A valid slug is required before uploading a sample PDF." };
  }

  // Path is fully server-controlled: sanitised slug segment + random UUID
  // filename. No part of the client filename is used in the path.
  const samplePdfStoragePath = `${READING_LIBRARY_SAMPLE_PREFIX}/${safeSlug}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await service.storage
    .from(READING_LIBRARY_BUCKET)
    .upload(samplePdfStoragePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("Authorised sample PDF upload failed:", uploadError);
    return { error: "Unable to upload the sample PDF right now." };
  }

  return { samplePdfStoragePath };
}

export async function removeAuthorisedSamplePdfObject(
  service: SupabaseClient,
  samplePdfStoragePath: string,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await service.storage
    .from(READING_LIBRARY_BUCKET)
    .remove([samplePdfStoragePath]);
  if (error) {
    console.error("Authorised sample PDF remove failed:", error);
    return { error: "Unable to remove the sample PDF." };
  }
  return { ok: true };
}
