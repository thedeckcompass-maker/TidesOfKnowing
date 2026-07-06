import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReadingLibraryAdminDraft,
  ReadingLibraryPublication,
  ReadingLibraryPublicationRow,
} from "./types";

const PUBLICATION_COLUMNS =
  "id, ask_leilia_request_id, slug, title, reading_type, question, summary, body, life_areas, primary_cards, spread_used, spread_image_paths, seo_description, pdf_storage_path, is_published, published_at, updated_at";

function mapPublication(row: ReadingLibraryPublicationRow): ReadingLibraryPublication {
  return {
    id: row.id,
    askLeiliaRequestId: row.ask_leilia_request_id,
    slug: row.slug,
    title: row.title,
    readingType: row.reading_type,
    question: row.question,
    summary: row.summary,
    body: row.body,
    lifeAreas: row.life_areas ?? [],
    primaryCards: row.primary_cards ?? [],
    spreadUsed: row.spread_used,
    spreadImagePaths: row.spread_image_paths ?? [],
    seoDescription: row.seo_description,
    pdfStoragePath: row.pdf_storage_path,
    isPublished: row.is_published,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    updatedAt: new Date(row.updated_at),
  };
}

export async function getPublishedLibraryPublications(
  service: SupabaseClient,
): Promise<ReadingLibraryPublication[]> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(PUBLICATION_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Unable to load published library readings:", error);
    return [];
  }

  return (data as ReadingLibraryPublicationRow[]).map(mapPublication);
}

export async function getPublishedLibraryPublicationBySlug(
  service: SupabaseClient,
  slug: string,
): Promise<ReadingLibraryPublication | null> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(PUBLICATION_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Unable to load library reading by slug:", error);
    return null;
  }

  return data ? mapPublication(data as ReadingLibraryPublicationRow) : null;
}

export async function getLibraryPublicationByRequestId(
  service: SupabaseClient,
  requestId: string,
): Promise<ReadingLibraryPublication | null> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(PUBLICATION_COLUMNS)
    .eq("ask_leilia_request_id", requestId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load library publication for request:", error);
    return null;
  }

  return data ? mapPublication(data as ReadingLibraryPublicationRow) : null;
}

export async function getLibraryPublicationsByRequestIds(
  service: SupabaseClient,
  requestIds: string[],
): Promise<Map<string, ReadingLibraryPublication>> {
  if (requestIds.length === 0) return new Map();

  const { data, error } = await service
    .from("reading_library_publications")
    .select(PUBLICATION_COLUMNS)
    .in("ask_leilia_request_id", requestIds);

  if (error) {
    console.error("Unable to load library publications for admin:", error);
    return new Map();
  }

  return new Map(
    (data as ReadingLibraryPublicationRow[])
      .filter((row) => row.ask_leilia_request_id)
      .map((row) => [row.ask_leilia_request_id as string, mapPublication(row)]),
  );
}

export async function upsertLibraryPublication(
  service: SupabaseClient,
  input: {
    requestId: string;
    question: string;
    readingType: string;
    deliveryPdfPath: string | null;
    draft: ReadingLibraryAdminDraft;
    existingPublishedAt: Date | null;
  },
): Promise<{ ok: true; publication: ReadingLibraryPublication } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const publishedAt = input.draft.isPublished
    ? (input.existingPublishedAt?.toISOString() ?? now)
    : input.existingPublishedAt?.toISOString() ?? null;

  const payload = {
    ask_leilia_request_id: input.requestId,
    slug: input.draft.slug,
    title: input.draft.title,
    reading_type: input.readingType,
    question: input.question,
    summary: input.draft.summary,
    body: input.draft.body,
    life_areas: input.draft.lifeAreas,
    primary_cards: input.draft.primaryCards,
    spread_used: input.draft.spreadUsed || null,
    spread_image_paths: input.draft.spreadImagePaths,
    seo_description: input.draft.seoDescription,
    pdf_storage_path: input.deliveryPdfPath,
    is_published: input.draft.isPublished,
    published_at: publishedAt,
    updated_at: now,
  };

  const { data, error } = await service
    .from("reading_library_publications")
    .upsert(payload, { onConflict: "ask_leilia_request_id" })
    .select(PUBLICATION_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That slug is already in use. Choose a different slug." };
    }
    console.error("Unable to save library publication:", error);
    return { ok: false, error: "Unable to save the library publication." };
  }

  return { ok: true, publication: mapPublication(data as ReadingLibraryPublicationRow) };
}
