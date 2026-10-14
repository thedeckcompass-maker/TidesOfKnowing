import type { StudioCard, StudioCardFamily, StudioGuidebookSection, StudioJournalEntry, StudioProject } from "./types";

export type StudioExport = {
  exported_at: string;
  project: StudioProject;
  families: StudioCardFamily[];
  cards: StudioCard[];
  guidebook: StudioGuidebookSection[];
  journal: StudioJournalEntry[];
  production_plan: Record<string, unknown> | null;
};

function exactField(value: unknown): string {
  const content = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const longestFence = Math.max(0, ...[...content.matchAll(/`+/g)].map(([match]) => match.length));
  const fence = "`".repeat(Math.max(3, longestFence + 1));
  return `${fence}${typeof value === "string" ? "text" : "json"}\n${content}\n${fence}`;
}

export function studioMarkdownExport(snapshot: StudioExport): string {
  const lines = [
    `# ${snapshot.project.name}`,
    "",
    snapshot.project.description,
    "",
    "## Cards",
  ];
  for (const card of snapshot.cards) {
    lines.push(`### ${card.card_number ? `${card.card_number} · ` : ""}${card.title}`, "");
    for (const [key, value] of Object.entries(card.content)) {
      lines.push(`#### ${key.replaceAll("_", " ")}`, "", exactField(value), "");
    }
  }
  lines.push("## Guidebook");
  for (const section of snapshot.guidebook) lines.push(`### ${section.title}`, "", section.body_markdown, "");
  lines.push("## Production and publication", "");
  if (snapshot.production_plan) {
    for (const [key, value] of Object.entries(snapshot.production_plan)) {
      if (["project_id", "created_at", "updated_at"].includes(key)) continue;
      lines.push(`### ${key.replaceAll("_", " ")}`, "", exactField(value), "");
    }
  } else {
    lines.push("No production plan recorded yet.", "");
  }
  lines.push("## Private journal");
  for (const entry of snapshot.journal) lines.push(`### ${entry.title}`, "", entry.body_markdown, "");
  return lines.join("\n");
}
