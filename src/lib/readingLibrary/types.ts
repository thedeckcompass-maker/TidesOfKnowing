export type ReadingLibraryPublication = {
  id: string;
  askLeiliaRequestId: string | null;
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
  pdfStoragePath: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type ReadingLibraryPublicationRow = {
  id: string;
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
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

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
