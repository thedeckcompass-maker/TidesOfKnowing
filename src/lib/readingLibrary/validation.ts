import { slugify } from "../../utils/slugify";
import type { ReadingLibraryAdminDraft } from "./types";

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

export function validateReadingLibraryDraft(
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
