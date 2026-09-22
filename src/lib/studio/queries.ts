import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StudioCard,
  StudioCardFamily,
  StudioGuidebookSection,
  StudioJournalEntry,
  StudioJournalExcerpt,
  StudioJournalPhoto,
  StudioProject,
  StudioVersion,
} from "./types";

export async function getStudioProjects(supabase: SupabaseClient): Promise<StudioProject[]> {
  const { data, error } = await supabase
    .from("studio_projects")
    .select("*")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudioProject[];
}

export async function getStudioJournalMedia(
  supabase: SupabaseClient,
  projectId: string,
  entryId: string,
): Promise<{ photos: StudioJournalPhoto[]; excerpts: StudioJournalExcerpt[] }> {
  const [photosResult, excerptsResult] = await Promise.all([
    supabase.from("studio_journal_photos").select("*").eq("project_id", projectId).eq("journal_entry_id", entryId).order("sort_order"),
    supabase.from("studio_journal_excerpts").select("*").eq("project_id", projectId).eq("journal_entry_id", entryId).order("updated_at", { ascending: false }),
  ]);
  if (photosResult.error) throw photosResult.error;
  if (excerptsResult.error) throw excerptsResult.error;
  return {
    photos: (photosResult.data ?? []) as StudioJournalPhoto[],
    excerpts: (excerptsResult.data ?? []) as StudioJournalExcerpt[],
  };
}

export async function getStudioProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<StudioProject | null> {
  const { data, error } = await supabase
    .from("studio_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return (data as StudioProject | null) ?? null;
}

export async function getStudioProjectWorkspace(supabase: SupabaseClient, projectId: string) {
  const [project, familiesResult, cardsResult, guidebookResult] = await Promise.all([
    getStudioProject(supabase, projectId),
    supabase.from("studio_card_families").select("*").eq("project_id", projectId).order("sort_order").order("created_at"),
    supabase.from("studio_cards").select("*").eq("project_id", projectId).order("sort_order").order("created_at"),
    supabase
      .from("studio_guidebook_sections")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order")
      .order("created_at"),
  ]);

  if (familiesResult.error) throw familiesResult.error;
  if (cardsResult.error) throw cardsResult.error;
  if (guidebookResult.error) throw guidebookResult.error;

  return {
    project,
    families: (familiesResult.data ?? []) as StudioCardFamily[],
    cards: (cardsResult.data ?? []) as StudioCard[],
    guidebook: (guidebookResult.data ?? []) as StudioGuidebookSection[],
  };
}

export async function getStudioCard(supabase: SupabaseClient, projectId: string, cardId: string) {
  const { data, error } = await supabase
    .from("studio_cards")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", cardId)
    .maybeSingle();
  if (error) throw error;
  return (data as StudioCard | null) ?? null;
}

export async function getStudioCardVersions(
  supabase: SupabaseClient,
  projectId: string,
  cardId: string,
): Promise<StudioVersion[]> {
  const { data, error } = await supabase
    .from("studio_card_versions")
    .select("id, version_number, snapshot, created_at")
    .eq("project_id", projectId)
    .eq("card_id", cardId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudioVersion[];
}

export async function getStudioGuidebookSection(
  supabase: SupabaseClient,
  projectId: string,
  sectionId: string,
) {
  const { data, error } = await supabase
    .from("studio_guidebook_sections")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", sectionId)
    .maybeSingle();
  if (error) throw error;
  return (data as StudioGuidebookSection | null) ?? null;
}

export async function getStudioGuidebookVersions(
  supabase: SupabaseClient,
  projectId: string,
  sectionId: string,
): Promise<StudioVersion[]> {
  const { data, error } = await supabase
    .from("studio_guidebook_versions")
    .select("id, version_number, snapshot, created_at")
    .eq("project_id", projectId)
    .eq("section_id", sectionId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudioVersion[];
}

export async function getStudioJournalEntries(
  supabase: SupabaseClient,
  projectId: string,
): Promise<StudioJournalEntry[]> {
  const { data, error } = await supabase
    .from("studio_journal_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudioJournalEntry[];
}

export async function getStudioJournalEntry(
  supabase: SupabaseClient,
  projectId: string,
  entryId: string,
): Promise<StudioJournalEntry | null> {
  const { data, error } = await supabase
    .from("studio_journal_entries")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", entryId)
    .maybeSingle();
  if (error) throw error;
  return (data as StudioJournalEntry | null) ?? null;
}
