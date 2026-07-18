import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthorisedSampleDraft,
  ReadingLibraryAdminDraft,
  ReadingLibraryAdminPublication,
  ReadingLibraryPublication,
  ReadingLibraryPublicationRow,
  ReadingLibrarySourceType,
} from "./types";
import { isReadingLibrarySourceType } from "./types";

/**
 * Public projection: no request id, no storage paths, no consent metadata.
 * This is the ONLY column set returned to public pages, cards, and JSON-LD.
 */
const PUBLIC_COLUMNS =
  "id, source_type, slug, title, reading_type, question, summary, body, life_areas, primary_cards, spread_used, spread_image_paths, seo_description, is_published, published_at, updated_at";

/**
 * Admin projection: adds request linkage, private storage paths, and consent
 * metadata. Never exposed to public/anonymous contexts.
 */
const ADMIN_COLUMNS = `${PUBLIC_COLUMNS}, ask_leilia_request_id, pdf_storage_path, sample_pdf_storage_path, sample_client_display_name, sample_display_name_public, sample_consent_confirmed_at, sample_consent_scope, sample_consent_note`;

function coerceSourceType(value: string | null | undefined): ReadingLibrarySourceType {
  return isReadingLibrarySourceType(value) ? value : "ask_leilia_request";
}

function mapPublicPublication(row: ReadingLibraryPublicationRow): ReadingLibraryPublication {
  return {
    id: row.id,
    sourceType: coerceSourceType(row.source_type),
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
    isPublished: row.is_published,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    updatedAt: new Date(row.updated_at),
  };
}

function mapAdminPublication(
  row: ReadingLibraryPublicationRow,
): ReadingLibraryAdminPublication {
  return {
    ...mapPublicPublication(row),
    askLeiliaRequestId: row.ask_leilia_request_id,
    deliveryPdfStoragePath: row.pdf_storage_path,
    samplePdfStoragePath: row.sample_pdf_storage_path,
    sampleClientDisplayName: row.sample_client_display_name,
    sampleDisplayNamePublic: Boolean(row.sample_display_name_public),
    sampleConsentConfirmedAt: row.sample_consent_confirmed_at
      ? new Date(row.sample_consent_confirmed_at)
      : null,
    sampleConsentScope: row.sample_consent_scope,
    sampleConsentNote: row.sample_consent_note,
  };
}

export async function getPublishedLibraryPublications(
  service: SupabaseClient,
): Promise<ReadingLibraryPublication[]> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(PUBLIC_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Unable to load published library readings:", error);
    return [];
  }

  return (data as ReadingLibraryPublicationRow[]).map(mapPublicPublication);
}

export async function getPublishedLibraryPublicationBySlug(
  service: SupabaseClient,
  slug: string,
): Promise<ReadingLibraryPublication | null> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Unable to load library reading by slug:", error);
    return null;
  }

  return data ? mapPublicPublication(data as ReadingLibraryPublicationRow) : null;
}

/**
 * Resolves the correct private Storage path for a PUBLISHED publication's PDF.
 * Request-linked publications use the delivered-request PDF; authorised samples
 * use the private sample PDF. Returns null for unpublished readings or when no
 * PDF exists. The raw path never reaches public HTML/JSON — callers use it only
 * to sign a URL or to test truthiness server-side.
 */
export async function resolveLibraryPdfSource(
  service: SupabaseClient,
  slug: string,
): Promise<{ sourceType: ReadingLibrarySourceType; storagePath: string } | null> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select("source_type, pdf_storage_path, sample_pdf_storage_path, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Unable to resolve library PDF source:", error);
    return null;
  }

  const row = data as Pick<
    ReadingLibraryPublicationRow,
    "source_type" | "pdf_storage_path" | "sample_pdf_storage_path"
  >;
  const sourceType = coerceSourceType(row.source_type);
  const storagePath =
    sourceType === "authorised_sample" ? row.sample_pdf_storage_path : row.pdf_storage_path;

  if (!storagePath) return null;
  return { sourceType, storagePath };
}

export async function getLibraryPublicationByRequestId(
  service: SupabaseClient,
  requestId: string,
): Promise<ReadingLibraryAdminPublication | null> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(ADMIN_COLUMNS)
    .eq("ask_leilia_request_id", requestId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load library publication for request:", error);
    return null;
  }

  return data ? mapAdminPublication(data as ReadingLibraryPublicationRow) : null;
}

export async function getLibraryPublicationsByRequestIds(
  service: SupabaseClient,
  requestIds: string[],
): Promise<Map<string, ReadingLibraryAdminPublication>> {
  if (requestIds.length === 0) return new Map();

  const { data, error } = await service
    .from("reading_library_publications")
    .select(ADMIN_COLUMNS)
    .in("ask_leilia_request_id", requestIds);

  if (error) {
    console.error("Unable to load library publications for admin:", error);
    return new Map();
  }

  return new Map(
    (data as ReadingLibraryPublicationRow[])
      .filter((row) => row.ask_leilia_request_id)
      .map((row) => [row.ask_leilia_request_id as string, mapAdminPublication(row)]),
  );
}

/** Authorised sample publications only (admin management view). */
export async function getAuthorisedSamplePublications(
  service: SupabaseClient,
): Promise<ReadingLibraryAdminPublication[]> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(ADMIN_COLUMNS)
    .eq("source_type", "authorised_sample")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Unable to load authorised sample publications:", error);
    return [];
  }

  return (data as ReadingLibraryPublicationRow[]).map(mapAdminPublication);
}

export async function getAuthorisedSampleById(
  service: SupabaseClient,
  id: string,
): Promise<ReadingLibraryAdminPublication | null> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(ADMIN_COLUMNS)
    .eq("id", id)
    .eq("source_type", "authorised_sample")
    .maybeSingle();

  if (error) {
    console.error("Unable to load authorised sample:", error);
    return null;
  }

  return data ? mapAdminPublication(data as ReadingLibraryPublicationRow) : null;
}

/**
 * Look up an authorised sample by its (unique) slug. Used to keep "create"
 * idempotent: a retried creation with the same slug resolves the existing row
 * and updates it in place instead of hitting the unique-slug constraint or
 * creating a duplicate.
 */
export async function getAuthorisedSampleBySlug(
  service: SupabaseClient,
  slug: string,
): Promise<ReadingLibraryAdminPublication | null> {
  const { data, error } = await service
    .from("reading_library_publications")
    .select(ADMIN_COLUMNS)
    .eq("slug", slug)
    .eq("source_type", "authorised_sample")
    .maybeSingle();

  if (error) {
    console.error("Unable to load authorised sample by slug:", error);
    return null;
  }

  return data ? mapAdminPublication(data as ReadingLibraryPublicationRow) : null;
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
): Promise<
  { ok: true; publication: ReadingLibraryAdminPublication } | { ok: false; error: string }
> {
  const now = new Date().toISOString();
  const publishedAt = input.draft.isPublished
    ? (input.existingPublishedAt?.toISOString() ?? now)
    : input.existingPublishedAt?.toISOString() ?? null;

  const payload = {
    source_type: "ask_leilia_request" as const,
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
    .select(ADMIN_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That slug is already in use. Choose a different slug." };
    }
    console.error("Unable to save library publication:", error);
    return { ok: false, error: "Unable to save the library publication." };
  }

  return { ok: true, publication: mapAdminPublication(data as ReadingLibraryPublicationRow) };
}

/**
 * Creates or updates an authorised sample publication. Never touches
 * ask_leilia_request_id (kept null) and never creates a request. Consent and
 * private-storage fields are written here but never surface in public queries.
 */
export async function upsertAuthorisedSample(
  service: SupabaseClient,
  input: {
    id: string | null;
    draft: AuthorisedSampleDraft;
    existingPublishedAt: Date | null;
  },
): Promise<
  { ok: true; publication: ReadingLibraryAdminPublication } | { ok: false; error: string }
> {
  const { draft } = input;
  const now = new Date().toISOString();
  const publishedAt = draft.isPublished
    ? (input.existingPublishedAt?.toISOString() ?? now)
    : input.existingPublishedAt?.toISOString() ?? null;

  const payload: Record<string, unknown> = {
    source_type: "authorised_sample" as const,
    ask_leilia_request_id: null,
    slug: draft.slug,
    title: draft.title,
    reading_type: draft.readingType,
    question: draft.question,
    summary: draft.summary,
    body: draft.body,
    life_areas: draft.lifeAreas,
    primary_cards: draft.primaryCards,
    spread_used: draft.spreadUsed || null,
    spread_image_paths: draft.spreadImagePaths,
    seo_description: draft.seoDescription,
    pdf_storage_path: null,
    sample_pdf_storage_path: draft.samplePdfStoragePath,
    sample_client_display_name: draft.clientDisplayName || null,
    sample_display_name_public: draft.displayNamePublic,
    sample_consent_confirmed_at: draft.consentConfirmedAt,
    sample_consent_scope: draft.consentScope || null,
    sample_consent_note: draft.consentNote || null,
    is_published: draft.isPublished,
    published_at: publishedAt,
    updated_at: now,
  };

  if (input.id) payload.id = input.id;

  const { data, error } = await service
    .from("reading_library_publications")
    .upsert(payload, { onConflict: "id" })
    .select(ADMIN_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That slug is already in use. Choose a different slug." };
    }
    console.error("Unable to save authorised sample publication:", error);
    return { ok: false, error: "Unable to save the authorised sample." };
  }

  return { ok: true, publication: mapAdminPublication(data as ReadingLibraryPublicationRow) };
}
