import { slugify } from "../../utils/slugify";
import type { AuthorisedSampleDraft, ReadingLibraryAdminDraft } from "./types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseCommaSeparatedList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseLineSeparatedList(value: string): string[] {
  return value
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeLibrarySlug(value: string): string {
  return slugify(value).slice(0, 80);
}

/**
 * Shared editorial validation applied to every Reading Library publication,
 * regardless of source. Kept identical to the original request-linked rules.
 */
function validateCoreDraft(
  draft: ReadingLibraryAdminDraft,
): { ok: true } | { ok: false; error: string } {
  if (draft.title.trim().length < 4) {
    return { ok: false, error: "Title must be at least 4 characters." };
  }

  if (!SLUG_PATTERN.test(draft.slug)) {
    return { ok: false, error: "Slug must use lowercase letters, numbers and hyphens only." };
  }

  if (draft.summary.trim().length < 20 || draft.summary.trim().length > 500) {
    return { ok: false, error: "Summary must be between 20 and 500 characters." };
  }

  if (draft.body.trim().length < 100) {
    return { ok: false, error: "Reading body must be at least 100 characters." };
  }

  if (draft.seoDescription.trim().length < 40 || draft.seoDescription.trim().length > 320) {
    return { ok: false, error: "SEO description must be between 40 and 320 characters." };
  }

  if (draft.isPublished && draft.primaryCards.length === 0) {
    return { ok: false, error: "Add at least one primary card before publishing." };
  }

  return { ok: true };
}

/** Request-linked publication validation (unchanged behaviour). */
export function validateReadingLibraryDraft(
  draft: ReadingLibraryAdminDraft,
): { ok: true } | { ok: false; error: string } {
  return validateCoreDraft(draft);
}

/**
 * Authorised sample validation. Applies all core editorial rules plus the
 * sample-only reading metadata and consent/storage publish gates.
 */
export function validateAuthorisedSampleDraft(
  draft: AuthorisedSampleDraft,
): { ok: true } | { ok: false; error: string } {
  const core = validateCoreDraft(draft);
  if (!core.ok) return core;

  if (draft.readingType.trim().length < 2 || draft.readingType.trim().length > 80) {
    return { ok: false, error: "Reading type must be between 2 and 80 characters." };
  }

  if (draft.question.trim().length < 10 || draft.question.trim().length > 2000) {
    return { ok: false, error: "Question must be between 10 and 2000 characters." };
  }

  if (draft.displayNamePublic && !draft.clientDisplayName.trim()) {
    return {
      ok: false,
      error: "Add a client display name before allowing it to be shown publicly.",
    };
  }

  if (draft.isPublished) {
    if (!draft.samplePdfStoragePath) {
      return {
        ok: false,
        error: "Upload the private sample PDF before publishing this reading.",
      };
    }
    if (!draft.consentConfirmedAt) {
      return {
        ok: false,
        error: "Confirm consent (with a confirmation date) before publishing this reading.",
      };
    }
  }

  return { ok: true };
}

export function readingLibraryDraftFromForm(form: FormData): ReadingLibraryAdminDraft {
  const title = String(form.get("libraryTitle") ?? "").trim();
  const slugInput = String(form.get("librarySlug") ?? "").trim();
  const slug = slugInput ? normalizeLibrarySlug(slugInput) : normalizeLibrarySlug(title);

  return {
    title,
    slug,
    summary: String(form.get("librarySummary") ?? "").trim(),
    body: String(form.get("libraryBody") ?? "").trim(),
    lifeAreas: parseCommaSeparatedList(String(form.get("libraryLifeAreas") ?? "")),
    primaryCards: parseCommaSeparatedList(String(form.get("libraryPrimaryCards") ?? "")),
    spreadUsed: String(form.get("librarySpreadUsed") ?? "").trim(),
    spreadImagePaths: parseLineSeparatedList(String(form.get("librarySpreadImages") ?? "")),
    seoDescription: String(form.get("librarySeoDescription") ?? "").trim(),
    isPublished: form.get("libraryPublish") === "on",
  };
}

/** Parses the "consent confirmed" date/datetime input into an ISO string or null. */
export function parseConsentConfirmedAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function authorisedSampleDraftFromForm(
  form: FormData,
  options?: { samplePdfStoragePath?: string | null },
): AuthorisedSampleDraft {
  const base = readingLibraryDraftFromForm(form);
  const consentConfirmedCheckbox = form.get("sampleConsentConfirmed") === "on";
  const parsedConsentDate = parseConsentConfirmedAt(form.get("sampleConsentConfirmedAt"));

  return {
    ...base,
    readingType: String(form.get("sampleReadingType") ?? "").trim(),
    question: String(form.get("sampleQuestion") ?? "").trim(),
    clientDisplayName: String(form.get("sampleClientDisplayName") ?? "").trim(),
    displayNamePublic: form.get("sampleDisplayNamePublic") === "on",
    // Consent is confirmed only when the checkbox is ticked AND a date is given.
    consentConfirmedAt: consentConfirmedCheckbox ? parsedConsentDate : null,
    consentScope: String(form.get("sampleConsentScope") ?? "").trim(),
    consentNote: String(form.get("sampleConsentNote") ?? "").trim(),
    samplePdfStoragePath:
      options?.samplePdfStoragePath !== undefined ? options.samplePdfStoragePath : null,
  };
}
