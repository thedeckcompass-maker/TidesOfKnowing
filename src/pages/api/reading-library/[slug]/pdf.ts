import type { APIRoute } from "astro";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { resolveLibraryPdfSource } from "../../../../lib/readingLibrary";
import { getAskLeiliaDeliveryPdfUrl } from "../../../../lib/ask-leilia/queries";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug?.trim();
  if (!slug) {
    return new Response("Not found.", { status: 404 });
  }

  const service = createCommunityServiceClient(locals);

  // Only published readings resolve a source. Request-linked readings use the
  // delivered-request PDF path; authorised samples use the private sample PDF
  // path. Unpublished readings resolve to null and never expose a PDF.
  const source = await resolveLibraryPdfSource(service, slug);
  if (!source) {
    return new Response("Not found.", { status: 404 });
  }

  // Both sources live in the same private bucket, delivered via a short-lived
  // signed URL. The storage path is never returned to the client directly.
  const signedUrl = await getAskLeiliaDeliveryPdfUrl(service, source.storagePath);
  if (!signedUrl) {
    return new Response("Unable to load PDF.", { status: 500 });
  }

  return Response.redirect(signedUrl, 302);
};
