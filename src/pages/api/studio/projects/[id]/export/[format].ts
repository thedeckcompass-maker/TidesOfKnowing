import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../../lib/studio/access";
import { getStudioJournalEntries, getStudioProductionPlan, getStudioProjectWorkspace } from "../../../../../../lib/studio/queries";
import { studioMarkdownExport, type StudioExport } from "../../../../../../lib/studio/export";
export const prerender = false;
export const GET: APIRoute = async ({ locals, params }) => {
  const access = studioAccessResponse(locals.user, locals.profile, "/studio/", locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !params.id || !["md","json"].includes(params.format ?? "")) return new Response("Not found", { status: 404 });
  const [workspace, journal] = await Promise.all([getStudioProjectWorkspace(locals.supabase, params.id), getStudioJournalEntries(locals.supabase, params.id)]);
  if (!workspace.project) return new Response("Not found", { status: 404 });
  const productionPlan = await getStudioProductionPlan(locals.supabase, params.id);
  const snapshot: StudioExport = { exported_at: new Date().toISOString(), project: workspace.project, families: workspace.families, cards: workspace.cards, guidebook: workspace.guidebook, journal, production_plan: productionPlan };
  const body = params.format === "json" ? JSON.stringify(snapshot, null, 2) : studioMarkdownExport(snapshot);
  return new Response(body, { headers: { "Content-Type": params.format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="studio-project-${params.id}.${params.format}"`, "Cache-Control": "private, no-store" } });
};
