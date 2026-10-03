import type { StudioVersion } from "./types";

export type VersionKind = "card" | "guidebook";
export type VersionField = { key: string; label: string; value: string };
export type VersionChange = { key: string; label: string; before: string; after: string };
export type DiffLine = { kind: "same" | "added" | "removed"; text: string };
export type VersionReferences = { families?: Record<string, string>; cards?: Record<string, string> };

const cardLabels: Record<string, string> = {
  title: "Title", card_number: "Card number", family_id: "Family", sort_order: "Order", status: "Status",
  meaning: "Core meaning", shadow_meaning: "Shadow or cautionary meaning", keywords: "Keywords",
  cautions: "Cautions", symbolism: "Symbolism", correspondences: "Correspondences",
  prompts: "Prompts or questions", research_notes: "Private research notes", sources: "Sources and attribution",
  cultural_context: "Cultural context", permissions: "Permissions and unresolved rights",
  artwork_brief: "Artwork brief", rights_status: "Artwork rights status", production_notes: "Production notes",
};
const guidebookLabels: Record<string, string> = {
  title: "Title", section_type: "Section type", sort_order: "Order", status: "Status",
  card_id: "Linked card", body_markdown: "Markdown manuscript", metadata: "Additional metadata",
};

function formatted(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function equal(a: unknown, b: unknown): boolean {
  const stable = (value: unknown) => JSON.stringify(value, (_, item: unknown) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item);
  return stable(a) === stable(b);
}

export function versionFields(snapshot: Record<string, unknown>, kind: VersionKind, references: VersionReferences = {}): VersionField[] {
  const labels = kind === "card" ? cardLabels : guidebookLabels;
  const fields = kind === "card"
    ? { ...snapshot, ...((snapshot.content && typeof snapshot.content === "object") ? snapshot.content as Record<string, unknown> : {}) }
    : snapshot;
  return Object.entries(fields)
    .filter(([key]) => key !== "content")
    .map(([key, value]) => ({
      key,
      label: labels[key] ?? key.replaceAll("_", " "),
      value: key === "family_id" && typeof value === "string" ? references.families?.[value] ?? value
        : key === "card_id" && typeof value === "string" ? references.cards?.[value] ?? value
        : formatted(value),
    }));
}

export function versionChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  kind: VersionKind,
  references: VersionReferences = {},
): VersionChange[] {
  const oldFields = new Map(versionFields(before ?? {}, kind, references).map((field) => [field.key, field]));
  const newFields = new Map(versionFields(after, kind, references).map((field) => [field.key, field]));
  return [...new Set([...oldFields.keys(), ...newFields.keys()])]
    .filter((key) => !equal(oldFields.get(key)?.value ?? "(empty)", newFields.get(key)?.value ?? "(empty)"))
    .map((key) => ({
      key,
      label: newFields.get(key)?.label ?? oldFields.get(key)?.label ?? key,
      before: oldFields.get(key)?.value ?? "(empty)",
      after: newFields.get(key)?.value ?? "(empty)",
    }));
}

export function matchingEarlierVersion(version: StudioVersion, versions: StudioVersion[]): number | null {
  const previous = versions.find((item) => item.version_number === version.version_number - 1);
  if (!previous || equal(previous.snapshot, version.snapshot)) return null;
  return [...versions]
    .filter((item) => item.version_number < version.version_number - 1)
    .sort((a, b) => b.version_number - a.version_number)
    .find((item) => equal(item.snapshot, version.snapshot))?.version_number ?? null;
}

export function diffLines(before: string, after: string): DiffLine[] {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  if (oldLines.length * newLines.length > 40000) {
    return [{ kind: "removed", text: before }, { kind: "added", text: after }];
  }
  const lengths = Array.from({ length: oldLines.length + 1 }, () => new Uint16Array(newLines.length + 1));
  for (let i = oldLines.length - 1; i >= 0; i--) {
    for (let j = newLines.length - 1; j >= 0; j--) {
      lengths[i][j] = oldLines[i] === newLines[j] ? lengths[i + 1][j + 1] + 1
        : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = 0; let j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      result.push({ kind: "same", text: oldLines[i++] }); j++;
    } else if (j < newLines.length && (i === oldLines.length || lengths[i][j + 1] > lengths[i + 1][j])) {
      result.push({ kind: "added", text: newLines[j++] });
    } else {
      result.push({ kind: "removed", text: oldLines[i++] });
    }
  }
  return result;
}
