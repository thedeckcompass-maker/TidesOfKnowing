export const STUDIO_DECK_TYPES = ["oracle", "tarot", "hybrid"] as const;
export const STUDIO_PATHWAYS = ["personal", "independent", "commercial"] as const;
export const STUDIO_PROJECT_STATUSES = [
  "planning",
  "writing",
  "artwork",
  "production",
  "complete",
  "archived",
] as const;
export const STUDIO_ITEM_STATUSES = ["outline", "draft", "review", "complete"] as const;
export const STUDIO_GUIDEBOOK_TYPES = [
  "front_matter",
  "card_entry",
  "instructions",
  "chapter",
  "closing",
  "other",
] as const;

export type StudioDeckType = (typeof STUDIO_DECK_TYPES)[number];
export type StudioPathway = (typeof STUDIO_PATHWAYS)[number];
export type StudioProjectStatus = (typeof STUDIO_PROJECT_STATUSES)[number];
export type StudioItemStatus = (typeof STUDIO_ITEM_STATUSES)[number];
export type StudioGuidebookType = (typeof STUDIO_GUIDEBOOK_TYPES)[number];

export type StudioProject = {
  id: string;
  owner_id: string;
  name: string;
  deck_type: StudioDeckType;
  pathway: StudioPathway;
  status: StudioProjectStatus;
  deck_size: number | null;
  purpose: string;
  intended_reader: string;
  promise: string;
  description: string;
  next_action: string;
  current_risk: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type StudioCardFamily = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  sort_order: number;
};

export type StudioCard = {
  id: string;
  project_id: string;
  family_id: string | null;
  title: string;
  card_number: string;
  sort_order: number;
  status: StudioItemStatus;
  content: Record<string, unknown>;
  version_number: number;
  updated_at: string;
};

export type StudioGuidebookSection = {
  id: string;
  project_id: string;
  section_type: StudioGuidebookType;
  title: string;
  sort_order: number;
  status: StudioItemStatus;
  body_markdown: string;
  card_id?: string | null;
  metadata?: Record<string, unknown>;
  version_number: number;
  updated_at: string;
};

export type StudioVersion = {
  id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  created_at: string;
  restored_from_version_id?: string | null;
};

export const studioDeckTypeLabel: Record<StudioDeckType, string> = {
  oracle: "Oracle",
  tarot: "Tarot",
  hybrid: "Hybrid",
};

export const studioPathwayLabel: Record<StudioPathway, string> = {
  personal: "Personal or gift edition",
  independent: "Independent publication",
  commercial: "Commercial or crowdfunded launch",
};

export const STUDIO_PROGRAMME_STATUSES = [
  "not_started",
  "in_progress",
  "complete"
] as const;

export type StudioProgrammeStatus =
  (typeof STUDIO_PROGRAMME_STATUSES)[number];

// Additional Studio data contracts from the released source.

export type StudioJournalEntry = {
  id: string;
  project_id: string;
  entry_kind: StudioJournalKind;
  title: string;
  body_markdown: string;
  tags: StudioJournalTag[];
  linked_card_id: string | null;
  linked_section_id: string | null;
  selected_for_process: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioJournalPhoto = {
  id: string;
  project_id: string;
  journal_entry_id: string;
  storage_path: string;
  caption: string;
  sort_order: number;
  created_at: string;
  retired_at?: string | null;
  replaces_photo_id?: string | null;
};

export type StudioJournalExcerpt = {
  id: string;
  project_id: string;
  journal_entry_id: string;
  purpose: StudioExcerptPurpose;
  title: string;
  excerpt_text: string;
  photo_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StudioCommunityShare = {
  id: string;
  project_id: string | null;
  journal_excerpt_id: string | null;
  community_post_id: string;
  owner_id: string;
  audience: StudioCommunityAudience;
  topic: StudioCommunityTopic;
  community_slug: string;
  title_snapshot: string;
  excerpt_snapshot: string;
  shared_at: string;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudioProgrammeModule = {
  week_number: number;
  slug: string;
  title: string;
  outcome: string;
  completion_condition: string;
  safely_unfinished: string;
  production_risk: string;
  personal_guidance: string;
  independent_guidance: string;
  commercial_guidance: string;
};

export type StudioProgrammeEnrolment = {
  project_id: string;
  starts_on: string;
  created_at: string;
};

export type StudioProgrammeProgress = {
  project_id: string;
  week_number: number;
  status: StudioProgrammeStatus;
  current_task: string;
  notes: string;
  completed_at: string | null;
  updated_at: string;
};

export type StudioProductionPlan = {
  project_id: string;
  status: "draft" | "review" | "ready";
  planned_quantity: number | null;
  target_release_date: string | null;
  component_specifications: string;
  artwork_delivery_specifications: string;
  rights_and_permissions: string;
  prototype_results: string;
  supplier_quotes: string;
  costing_and_pricing: string;
  fulfilment_plan: string;
  publication_assets: string;
  launch_decision: string;
  next_action: string;
  version_number: number;
  created_at: string;
  updated_at: string;
};

// Verified additional Studio constants.

export const STUDIO_JOURNAL_KINDS = ["reflection", "decision", "milestone"] as const;

export const STUDIO_JOURNAL_TAGS = [
  "research",
  "artwork",
  "resistance",
  "breakthrough",
  "testing",
  "production",
  "launch",
] as const;

export const STUDIO_EXCERPT_PURPOSES = [
  "kickstarter",
  "newsletter",
  "social",
  "case_study",
  "community",
  "private_record",
] as const;

export const STUDIO_COMMUNITY_TOPICS = [
  "introduction",
  "concept_symbolism",
  "cards_guidebook",
  "artwork_collaboration",
  "testing_refinement",
  "production_publishing",
  "crowdfunding_launch",
  "workshop_question",
  "progress_reflection",
] as const;

// Verified Studio supporting declarations.

export type StudioJournalKind = (typeof STUDIO_JOURNAL_KINDS)[number];

export type StudioJournalTag = (typeof STUDIO_JOURNAL_TAGS)[number];

export type StudioExcerptPurpose = (typeof STUDIO_EXCERPT_PURPOSES)[number];

export type StudioCommunityAudience = (typeof STUDIO_COMMUNITY_AUDIENCES)[number];

export type StudioCommunityTopic = (typeof STUDIO_COMMUNITY_TOPICS)[number];

export const STUDIO_COMMUNITY_AUDIENCES = ["members", "public"] as const;

export const STUDIO_ARTIST_PROCESS_DISCLOSURES = [
  "human_created",
  "digital_non_generative",
  "ai_assisted",
  "generative_ai",
] as const;

export type StudioArtistProcessDisclosure = (typeof STUDIO_ARTIST_PROCESS_DISCLOSURES)[number];

export const studioArtistProcessLabel: Record<StudioArtistProcessDisclosure, string> = {
  human_created: "Human-created physical practice",
  digital_non_generative: "Digital, without generative AI",
  ai_assisted: "AI-assisted process",
  generative_ai: "Generative-AI process",
};
export type StudioArtistPortfolioExample = {
  url: string;
  title: string;
  description: string;
};
