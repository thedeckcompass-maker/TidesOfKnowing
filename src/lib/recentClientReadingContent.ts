/** Top-level Markdown sections for Recent Client Reading entries. */
export const RCR_SECTION_READING = "Reading";
export const RCR_SECTION_EDITOR_NOTES = "Editor Notes";
export const RCR_SECTION_RELATED_SUGGESTIONS = "Related Reading Suggestions";

export const RCR_EDITOR_NOTES_PLACEHOLDER = "_To be added._";
export const RCR_RELATED_SUGGESTIONS_PLACEHOLDER = "_To be added._";

export type RecentClientReadingSections = {
  reading: string;
  editorNotes: string;
  relatedSuggestions: string;
};

function sectionContent(body: string, heading: string, nextHeadings: string[]): string {
  const start = new RegExp(`^#\\s+${escapeRegExp(heading)}\\s*$`, "m");
  const match = start.exec(body);
  if (!match || match.index === undefined) return "";

  const afterHeading = body.slice(match.index + match[0].length);
  let end = afterHeading.length;

  for (const next of nextHeadings) {
    const nextRe = new RegExp(`^#\\s+${escapeRegExp(next)}\\s*$`, "m");
    const nextMatch = nextRe.exec(afterHeading);
    if (nextMatch?.index !== undefined && nextMatch.index < end) {
      end = nextMatch.index;
    }
  }

  const hrSplit = afterHeading.slice(0, end).split(/\n---\n/);
  return hrSplit[0].replace(/^\s+/, "").replace(/\s+$/, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parse the three canonical body sections from markdown content. */
export function parseRecentClientReadingSections(body: string): RecentClientReadingSections {
  const normalized = body.replace(/\r\n/g, "\n").trim();
  const hasReadingHeading = new RegExp(
    `^#\\s+${escapeRegExp(RCR_SECTION_READING)}\\s*$`,
    "m",
  ).test(normalized);

  if (!hasReadingHeading) {
    return {
      reading: normalized,
      editorNotes: "",
      relatedSuggestions: "",
    };
  }

  return {
    reading: sectionContent(normalized, RCR_SECTION_READING, [
      RCR_SECTION_EDITOR_NOTES,
      RCR_SECTION_RELATED_SUGGESTIONS,
    ]),
    editorNotes: sectionContent(normalized, RCR_SECTION_EDITOR_NOTES, [
      RCR_SECTION_RELATED_SUGGESTIONS,
    ]),
    relatedSuggestions: sectionContent(normalized, RCR_SECTION_RELATED_SUGGESTIONS, []),
  };
}

/** Build a full reading document with placeholder editorial sections. */
export function buildRecentClientReadingBody(readingMarkdown: string): string {
  const reading = readingMarkdown.trim();
  const readingBlock = reading.startsWith(`# ${RCR_SECTION_READING}`)
    ? reading
    : `# ${RCR_SECTION_READING}\n\n${reading}`;

  return [
    readingBlock,
    "---",
    `# ${RCR_SECTION_EDITOR_NOTES}`,
    "",
    RCR_EDITOR_NOTES_PLACEHOLDER,
    "---",
    `# ${RCR_SECTION_RELATED_SUGGESTIONS}`,
    "",
    RCR_RELATED_SUGGESTIONS_PLACEHOLDER,
  ].join("\n\n");
}

/** Plain text approximation for schema.org articleBody. */
export function plainTextFromReadingMarkdown(body: string): string {
  return body
    .replace(/^---\s*$/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Whether editor notes section has non-placeholder content. */
export function hasSubstantiveEditorNotes(body: string): boolean {
  const { editorNotes } = parseRecentClientReadingSections(body);
  const trimmed = editorNotes.trim();
  if (!trimmed) return false;
  return trimmed !== RCR_EDITOR_NOTES_PLACEHOLDER;
}
