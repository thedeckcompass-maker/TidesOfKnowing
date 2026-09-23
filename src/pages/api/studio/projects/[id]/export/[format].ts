import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../../lib/studio/access";
import { getStudioJournalEntries, getStudioProductionPlan, getStudioProject, getStudioProjectWorkspace } from "../../../../../../lib/studio/queries";
import { studioMarkdownExport, type StudioExport } from "../../../../../../lib/studio/export";
import { buildStudioProjectFolder, creatorMayExport, type FolderMedia, type FolderRecords } from "../../../../../../lib/studio/projectFolder";
import { STUDIO_JOURNAL_PHOTO_BUCKET } from "../../../../../../lib/studio/journalMedia";
import type { SupabaseClient } from "@supabase/supabase-js";
export const prerender = false;

async function allProjectRows(supabase: SupabaseClient, table: string, projectId: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    const orderColumn = table === "studio_import_records" ? "imported_at" : "created_at";
    const tieColumn = table === "studio_production_plan_versions" ? "version_number" : "id";
    const { data, error } = await supabase.from(table).select("*").eq("project_id", projectId).order(orderColumn).order(tieColumn).range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 500) return rows;
  }
}

export const GET: APIRoute = async ({ locals, params }) => {
  const access = studioAccessResponse(locals.user, locals.profile, "/studio/", locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !params.id || !["md","json","zip"].includes(params.format ?? "")) return new Response("Not found", { status: 404 });
  const project = await getStudioProject(locals.supabase, params.id);
  if (!project || !creatorMayExport(project.owner_id, locals.user?.id)) return new Response("Not found", { status: 404 });
  const [workspace, journal] = await Promise.all([getStudioProjectWorkspace(locals.supabase, params.id), params.format === "zip" ? allProjectRows(locals.supabase, "studio_journal_entries", params.id) : getStudioJournalEntries(locals.supabase, params.id)]);
  if (!workspace.project) return new Response("Not found", { status: 404 });
  const productionPlan = await getStudioProductionPlan(locals.supabase, params.id);
  const snapshot: StudioExport = { exported_at: new Date().toISOString(), project: workspace.project, families: workspace.families, cards: workspace.cards, guidebook: workspace.guidebook, journal: journal as StudioExport["journal"], production_plan: productionPlan };
  if (params.format === "zip") {
    snapshot.guidebook = await allProjectRows(locals.supabase, "studio_guidebook_sections", params.id) as StudioExport["guidebook"];
    snapshot.guidebook.sort((a, b) => a.sort_order - b.sort_order);
    const tables = ["studio_card_versions", "studio_guidebook_versions", "studio_production_plan_versions", "studio_import_records", "studio_journal_photos", "studio_journal_excerpts"];
    const [card_versions, guidebook_versions, production_plan_versions, import_records, photos, excerpts] = await Promise.all(tables.map((table) => allProjectRows(locals.supabase!, table, params.id!)));
    const records = { card_versions, guidebook_versions, production_plan_versions, import_records, photos, excerpts } as unknown as FolderRecords;
    const media: FolderMedia = [];
    let mediaBytes = 0;
    const maxMediaBytes = 96 * 1024 * 1024;
    for (const photo of records.photos) {
      if (mediaBytes >= maxMediaBytes) { media.push({ photo_id: photo.id, omission: "Export photograph limit reached (96 MB)" }); continue; }
      // The record and its storage path were obtained under the creator's RLS context.
      const { data, error } = await locals.supabase.storage.from(STUDIO_JOURNAL_PHOTO_BUCKET).download(photo.storage_path);
      if (error || !data) { media.push({ photo_id: photo.id, omission: "Stored photograph unavailable or access denied" }); continue; }
      const bytes = new Uint8Array(await data.arrayBuffer());
      if (mediaBytes + bytes.length > maxMediaBytes) { media.push({ photo_id: photo.id, omission: "Export photograph limit reached (96 MB)" }); continue; }
      media.push({ photo_id: photo.id, bytes }); mediaBytes += bytes.length;
    }
    const bytes = buildStudioProjectFolder(snapshot, records, media);
    return new Response(bytes as BodyInit, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="studio-project-${params.id}.zip"`, "Cache-Control": "private, no-store" } });
  }
  const body = params.format === "json" ? JSON.stringify(snapshot, null, 2) : studioMarkdownExport(snapshot);
  return new Response(body, { headers: { "Content-Type": params.format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="studio-project-${params.id}.${params.format}"`, "Cache-Control": "private, no-store" } });
};
