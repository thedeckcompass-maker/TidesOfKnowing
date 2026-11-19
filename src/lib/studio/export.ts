import {outlineManuscript} from './guidebookOutline';
import { readingManuscript } from './readingText.ts';
import type { StudioCard, StudioCardFamily, StudioGuidebookSection, StudioJournalEntry, StudioProject } from "./types";
import { readableFields, fieldsMarkdown } from './readableFields.ts';

export type StudioExport = {
  exported_at: string;
  project: StudioProject;
  families: StudioCardFamily[];
  cards: StudioCard[];
  guidebook: StudioGuidebookSection[];
  journal: StudioJournalEntry[];
  production_plan: Record<string, unknown> | null;
};

export function studioMarkdownExport(snapshot: StudioExport): string {
  const references = { families: Object.fromEntries(snapshot.families.map(f => [f.id, f.name])), cards: Object.fromEntries(snapshot.cards.map(c => [c.id, c.title])) };
  const lines = [
    `# ${snapshot.project.name}`,
    "",
    snapshot.project.description,
    "",
    "## Cards",
  ];
  for (const card of snapshot.cards) {
    lines.push(`### ${card.card_number ? `${card.card_number} · ` : ""}${card.title}`, "");
    lines.push(fieldsMarkdown(readableFields(card as unknown as Record<string, unknown>, 'card', references).filter(f => !['title', 'card_number'].includes(f.key)), '####'), '');
  }
  lines.push("## Guidebook", outlineManuscript(snapshot.project,snapshot.cards));
  for (const section of snapshot.guidebook) lines.push(`### ${section.title}`, "", readingManuscript(section), "", fieldsMarkdown(readableFields({ metadata: section.metadata }, 'guidebook'), '####'), '');
  lines.push("## Production and publication", "");
  if (snapshot.production_plan) {
    lines.push(fieldsMarkdown(readableFields(snapshot.production_plan, 'production'), '###'), '');
  } else {
    lines.push("No production plan recorded yet.", "");
  }
  lines.push("## Private journal");
  for (const entry of snapshot.journal) lines.push(`### ${entry.title}`, "", entry.body_markdown, "");
  return lines.join("\n");
}
