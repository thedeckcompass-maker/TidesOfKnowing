import {
  DISPLAY_NAME_MAX_LENGTH,
  isReservedDisplayName,
  normalizeDisplayName,
} from "./displayNames";
import {
  COMMUNITY_REPORT_REASONS,
  READING_PRACTICE_POST_TYPES,
  type CommunitySectionKey,
  type CommunityReportReason,
  type ReadingPracticePostType,
} from "./types";

const SECTION_KEYS: CommunitySectionKey[] = ["reading-practice", "reader-development"];
const READING_PRACTICE_POST_TYPE_VALUES = READING_PRACTICE_POST_TYPES.map((type) => type.value);
const COMMUNITY_REPORT_REASON_VALUES = COMMUNITY_REPORT_REASONS.map((reason) => reason.value);

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

export function isReadingPracticePostType(value: unknown): value is ReadingPracticePostType {
  return (
    typeof value === "string" &&
    READING_PRACTICE_POST_TYPE_VALUES.includes(value as ReadingPracticePostType)
  );
}

export function isCommunityReportReason(value: unknown): value is CommunityReportReason {
  return (
    typeof value === "string" &&
    COMMUNITY_REPORT_REASON_VALUES.includes(value as CommunityReportReason)
  );
}

export function validatePostInput(input: {
  sectionKey: unknown;
  title: unknown;
  body: unknown;
  postType?: unknown;
  fieldNoteConsideration?: unknown;
}): ValidationResult<{
  sectionKey: CommunitySectionKey;
  title: string;
  body: string;
  postType: ReadingPracticePostType | null;
  fieldNoteConsideration: boolean;
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

  if (input.sectionKey === "reading-practice") {
    if (input.postType && !isReadingPracticePostType(input.postType)) {
      return { ok: false, error: "Choose a Reading Practice discussion type." };
    }
    const postType = isReadingPracticePostType(input.postType) ? input.postType : null;
    const fieldNoteConsideration =
      input.fieldNoteConsideration === true ||
      input.fieldNoteConsideration === "true" ||
      input.fieldNoteConsideration === "on";

    return {
      ok: true,
      value: {
        sectionKey: input.sectionKey,
        title,
        body,
        postType: postType || null,
        fieldNoteConsideration,
      },
    };
  }

  return {
    ok: true,
    value: {
      sectionKey: input.sectionKey,
      title,
      body,
      postType: null,
      fieldNoteConsideration: false,
    },
  };
}

export function validateReplyInput(input: { body: unknown }): ValidationResult<{ body: string }> {
  const body = cleanText(input.body);

  if (body.length < 2 || body.length > 8000) {
    return { ok: false, error: "Replies should be 2 to 8,000 characters." };
  }

  return { ok: true, value: { body } };
}

export function validateDisplayName(value: unknown): ValidationResult<{ displayName: string }> {
  const raw = typeof value === "string" ? value : "";
  const displayName = normalizeDisplayName(raw);

  if (!displayName) {
    return { ok: false, error: "Display name cannot be empty." };
  }

  if (displayName.length < 2) {
    return { ok: false, error: "Display name should be at least 2 characters." };
  }

  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (isReservedDisplayName(displayName)) {
    return {
      ok: false,
      error: "That display name is not available. Please choose another.",
    };
  }

  return { ok: true, value: { displayName } };
}

export function validateReportInput(input: {
  contentType: unknown;
  contentId: unknown;
  reason: unknown;
  notes?: unknown;
}): ValidationResult<{
  contentType: "post" | "reply";
  contentId: string;
  reason: CommunityReportReason;
  notes: string | null;
}> {
  const contentType = input.contentType === "reply" ? "reply" : input.contentType === "post" ? "post" : null;
  const contentId = cleanText(input.contentId);
  const notes = cleanText(input.notes).slice(0, 2000);

  if (!contentType) {
    return { ok: false, error: "Choose what you are reporting." };
  }

  if (!contentId) {
    return { ok: false, error: "Missing reported content." };
  }

  if (!isCommunityReportReason(input.reason)) {
    return { ok: false, error: "Choose a report reason." };
  }

  return {
    ok: true,
    value: {
      contentType,
      contentId,
      reason: input.reason,
      notes: notes || null,
    },
  };
}
