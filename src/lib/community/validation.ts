import type { CommunitySectionKey } from "./types";

const SECTION_KEYS: CommunitySectionKey[] = ["reading-practice", "reader-development"];

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n");
}

export function isCommunitySectionKey(value: unknown): value is CommunitySectionKey {
  return typeof value === "string" && SECTION_KEYS.includes(value as CommunitySectionKey);
}

export function validatePostInput(input: {
  sectionKey: unknown;
  title: unknown;
  body: unknown;
}): ValidationResult<{
  sectionKey: CommunitySectionKey;
  title: string;
  body: string;
}> {
  const title = cleanText(input.title).replace(/\s+/g, " ");
  const body = cleanText(input.body);

  if (!isCommunitySectionKey(input.sectionKey)) {
    return { ok: false, error: "Choose Reading Practice or Reader Development." };
  }

  if (title.length < 8 || title.length > 140) {
    return { ok: false, error: "Post titles should be 8 to 140 characters." };
  }

  if (body.length < 20 || body.length > 12000) {
    return { ok: false, error: "Posts should be 20 to 12,000 characters." };
  }

  return { ok: true, value: { sectionKey: input.sectionKey, title, body } };
}

export function validateReplyInput(input: { body: unknown }): ValidationResult<{ body: string }> {
  const body = cleanText(input.body);

  if (body.length < 2 || body.length > 8000) {
    return { ok: false, error: "Replies should be 2 to 8,000 characters." };
  }

  return { ok: true, value: { body } };
}

export function validateDisplayName(value: unknown): ValidationResult<{ displayName: string }> {
  const displayName = cleanText(value).replace(/\s+/g, " ").slice(0, 60);

  if (displayName.length < 2) {
    return { ok: false, error: "Display name should be at least 2 characters." };
  }

  return { ok: true, value: { displayName } };
}
