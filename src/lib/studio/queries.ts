import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StudioCard,
  StudioCardFamily,
  StudioGuidebookSection,
  StudioProject,
  StudioVersion,
  StudioJournalEntry,
  StudioJournalExcerpt,
  StudioJournalPhoto,
  StudioCommunityShare,
  StudioProgrammeEnrolment,
  StudioProgrammeModule,
  StudioProgrammeProgress,
  StudioProductionPlan} from "./types";

export async function getStudioProjects(supabase: SupabaseClient): Promise<StudioProject[]> {
  const { data, error } = await supabase
    .from("studio_projects")
    .select("*")
    .neq("status", "archived")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudioProject[];
}

export async function getStudioProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<StudioProject | null> {
  const { data, error } = await supabase
    .from("studio_projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as StudioProject | null) ?? null;
}

export async function getStudioProjectWorkspace(supabase: SupabaseClient, projectId: string) {
  const [project, familiesResult, cardsResult, guidebookResult] = await Promise.all([
    getStudioProject(supabase, projectId),
    supabase.from("studio_card_families").select("*").eq("project_id", projectId).order("sort_order").order("created_at"),
    supabase.from("studio_cards").select("*").eq("project_id", projectId).is("deleted_at", null).order("sort_order").order("created_at"),
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

export async function getDeletedStudioCardIds(supabase: SupabaseClient, projectId: string): Promise<string[]> {
  const ids:string[]=[];
  for(let offset=0;;offset+=500){
    const {data,error}=await supabase.from('studio_cards').select('id').eq('project_id',projectId).not('deleted_at','is',null).order('id').range(offset,offset+499);
    if(error)throw error;
    ids.push(...(data??[]).map((row:{id:string})=>row.id));
    if((data??[]).length<500)return ids;
  }
}

export async function getStudioCard(supabase: SupabaseClient, projectId: string, cardId: string) {
  const { data, error } = await supabase
    .from("studio_cards")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", cardId)
    .is("deleted_at", null)
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


// Additional released Studio query functions.

export async function getStudioProductionPlan(supabase: SupabaseClient, projectId: string): Promise<StudioProductionPlan | null> {
  const { data, error } = await supabase.from("studio_production_plans")
    .select("*").eq("project_id", projectId).maybeSingle();
  if (error) throw error;
  return (data as StudioProductionPlan | null) ?? null;
}

export async function getStudioProductionPlanVersions(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase.from("studio_production_plan_versions")
    .select("version_number, created_at").eq("project_id", projectId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{ version_number: number; created_at: string }>;
}

export async function getStudioJournalMedia(
  supabase: SupabaseClient,
  projectId: string,
  entryId: string,
): Promise<{ photos: StudioJournalPhoto[]; excerpts: StudioJournalExcerpt[]; shares: StudioCommunityShare[] }> {
  const [photosResult, excerptsResult] = await Promise.all([
    supabase.from("studio_journal_photos").select("*").eq("project_id", projectId).eq("journal_entry_id", entryId).order("sort_order"),
    supabase.from("studio_journal_excerpts").select("*").eq("project_id", projectId).eq("journal_entry_id", entryId).order("updated_at", { ascending: false }),
  ]);
  if (photosResult.error) throw photosResult.error;
  if (excerptsResult.error) throw excerptsResult.error;
  const excerpts = (excerptsResult.data ?? []) as StudioJournalExcerpt[];
  return {
    photos: (photosResult.data ?? []).filter((p:any)=>!p.retired_at) as StudioJournalPhoto[],
    excerpts,
    shares: [] as StudioCommunityShare[],
  };
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

export async function getStudioProgramme(supabase: SupabaseClient, projectId: string): Promise<{
  modules: StudioProgrammeModule[];
  enrolment: StudioProgrammeEnrolment | null;
  progress: StudioProgrammeProgress[];
}> {
  const [modulesResult, enrolmentResult, progressResult] = await Promise.all([
    supabase.from("studio_programme_modules").select("*").order("week_number"),
    supabase.from("studio_programme_enrolments").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("studio_programme_progress").select("*").eq("project_id", projectId).order("week_number"),
  ]);

  if (modulesResult.error) throw modulesResult.error;
  if (enrolmentResult.error) throw enrolmentResult.error;
  if (progressResult.error) throw progressResult.error;

  return {
    modules: (modulesResult.data ?? []) as StudioProgrammeModule[],
    enrolment: (enrolmentResult.data as StudioProgrammeEnrolment | null) ?? null,
    progress: (progressResult.data ?? []) as StudioProgrammeProgress[],
  };
}
