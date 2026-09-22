import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../../lib/studio/access";
import { getStudioJournalEntries, getStudioProjectWorkspace } from "../../../../../../lib/studio/queries";
export const prerender = false;
export const GET: APIRoute = async ({ locals, params }) => {
  const access = studioAccessResponse(locals.user, locals.profile, "/studio/", locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !params.id || !["md","json"].includes(params.format ?? "")) return new Response("Not found", { status: 404 });
  const [workspace, journal] = await Promise.all([getStudioProjectWorkspace(locals.supabase, params.id), getStudioJournalEntries(locals.supabase, params.id)]);
  if (!workspace.project) return new Response("Not found", { status: 404 });
  const snapshot = { exported_at: new Date().toISOString(), project: workspace.project, families: workspace.families, cards: workspace.cards, guidebook: workspace.guidebook, journal };
  const body = params.format === "json" ? JSON.stringify(snapshot, null, 2) : [`# ${workspace.project.name}`, "", workspace.project.description, "", "## Cards", ...workspace.cards.flatMap((card) => [`### ${card.card_number ? `${card.card_number} · ` : ""}${card.title}`, "", ...Object.entries(card.content).map(([key,value]) => `**${key.replaceAll("_"," ")}:** ${value}`), ""]), "## Guidebook", ...workspace.guidebook.flatMap((section) => [`### ${section.title}`, "", section.body_markdown, ""]), "## Private journal", ...journal.flatMap((entry) => [`### ${entry.title}`, "", entry.body_markdown, ""])].join("\n");
  return new Response(body, { headers: { "Content-Type": params.format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="studio-project-${params.id}.${params.format}"`, "Cache-Control": "private, no-store" } });
};
