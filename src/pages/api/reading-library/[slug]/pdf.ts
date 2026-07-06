import type { APIRoute } from "astro";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { getPublishedLibraryPublicationBySlug } from "../../../../lib/readingLibrary";
import { getAskLeiliaDeliveryPdfUrl } from "../../../../lib/ask-leilia/queries";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug?.trim();
  if (!slug) {
    return new Response("Not found.", { status: 404 });
  }

  const service = createCommunityServiceClient(locals);
  const publication = await getPublishedLibraryPublicationBySlug(service, slug);

  if (!publication?.pdfStoragePath) {
    return new Response("Not found.", { status: 404 });
  }

  const signedUrl = await getAskLeiliaDeliveryPdfUrl(service, publication.pdfStoragePath);
  if (!signedUrl) {
    return new Response("Unable to load PDF.", { status: 500 });
  }

  return Response.redirect(signedUrl, 302);
};
