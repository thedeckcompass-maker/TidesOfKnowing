export const ASK_LEILIA_READING_TYPES = [
  "one-question",
  "in-depth",
  "personal-guidance",
] as const;

export type AskLeiliaReadingType = (typeof ASK_LEILIA_READING_TYPES)[number];

export const ASK_LEILIA_READING_TYPE_LABELS: Record<AskLeiliaReadingType, string> = {
  "one-question": "One Question Reading",
  "in-depth": "In-Depth Reading",
  "personal-guidance": "Personal Guidance Reading",
};

export const ASK_LEILIA_REQUEST_PATHS: Record<AskLeiliaReadingType, string> = {
  "one-question": "/ask-leilia/request/",
  "in-depth": "/ask-leilia/request/in-depth/",
  "personal-guidance": "/ask-leilia/request/personal-guidance/",
};

export function isAskLeiliaReadingType(value: unknown): value is AskLeiliaReadingType {
  return typeof value === "string" && ASK_LEILIA_READING_TYPES.includes(value as AskLeiliaReadingType);
}
