export const READING_LIBRARY_SOURCE_TYPES = [
  "ask_leilia_request",
  "authorised_sample",
] as const;

export type ReadingLibrarySourceType = (typeof READING_LIBRARY_SOURCE_TYPES)[number];

export function isReadingLibrarySourceType(
  value: unknown,
): value is ReadingLibrarySourceType {
  return (
    typeof value === "string" &&
    READING_LIBRARY_SOURCE_TYPES.includes(value as ReadingLibrarySourceType)
  );
}

/**
 * Public-safe publication shape. Intentionally omits request identifiers,
 * private storage paths, and all consent metadata. This is the only shape used
 * by public pages, cards, and JSON-LD.
 */
export type ReadingLibraryPublication = {
  id: string;
  sourceType: ReadingLibrarySourceType;
  slug: string;
  title: string;
  readingType: string;
  question: string;
  summary: string;
  body: string;
  lifeAreas: string[];
  primaryCards: string[];
  spreadUsed: string | null;
  spreadImagePaths: string[];
  seoDescription: string;
  isPublished: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};

/**
 * Admin-only superset. Includes request linkage, private storage paths, and
 * consent metadata. Never returned to public/anonymous contexts.
 */
export type ReadingLibraryAdminPublication = ReadingLibraryPublication & {
  askLeiliaRequestId: string | null;
  deliveryPdfStoragePath: string | null;
  samplePdfStoragePath: string | null;
  sampleClientDisplayName: string | null;
  sampleDisplayNamePublic: boolean;
  sampleConsentConfirmedAt: Date | null;
  sampleConsentScope: string | null;
  sampleConsentNote: string | null;
};

export type ReadingLibraryPublicationRow = {
  id: string;
  source_type: string;
  ask_leilia_request_id: string | null;
  slug: string;
  title: string;
  reading_type: string;
  question: string;
  summary: string;
  body: string;
  life_areas: string[] | null;
  primary_cards: string[] | null;
  spread_used: string | null;
  spread_image_paths: string[] | null;
  seo_description: string;
  pdf_storage_path: string | null;
  sample_pdf_storage_path: string | null;
  sample_client_display_name: string | null;
  sample_display_name_public: boolean | null;
  sample_consent_confirmed_at: string | null;
  sample_consent_scope: string | null;
  sample_consent_note: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

/** Shared editorial fields for a Reading Library publication draft. */
export type ReadingLibraryAdminDraft = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  lifeAreas: string[];
  primaryCards: string[];
  spreadUsed: string;
  spreadImagePaths: string[];
  seoDescription: string;
  isPublished: boolean;
};

/**
 * Authorised sample draft. Extends the shared editorial fields with the
 * sample-only reading metadata and consent controls. `question` and
 * `readingType` are required because the underlying table enforces them for
 * every publication regardless of source.
 */
export type AuthorisedSampleDraft = ReadingLibraryAdminDraft & {
  readingType: string;
  question: string;
  clientDisplayName: string;
  displayNamePublic: boolean;
  /** ISO timestamp string, or null when consent has not yet been confirmed. */
  consentConfirmedAt: string | null;
  consentScope: string;
  consentNote: string;
  /** Private Storage path to the sample PDF, or null when not uploaded yet. */
  samplePdfStoragePath: string | null;
};
