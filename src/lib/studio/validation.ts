import {
  STUDIO_DECK_TYPES,
  STUDIO_EXCERPT_PURPOSES,
  STUDIO_COMMUNITY_AUDIENCES,
  STUDIO_COMMUNITY_TOPICS,
  STUDIO_GUIDEBOOK_TYPES,
  STUDIO_ITEM_STATUSES,
  STUDIO_JOURNAL_KINDS,
  STUDIO_JOURNAL_TAGS,
  STUDIO_PATHWAYS,
  STUDIO_ARTIST_PROCESS_DISCLOSURES,
  STUDIO_PROGRAMME_STATUSES,
  STUDIO_PROJECT_STATUSES,
  type StudioDeckType,
  type StudioExcerptPurpose,
  type StudioCommunityAudience,
  type StudioCommunityTopic,
  type StudioGuidebookType,
  type StudioItemStatus,
  type StudioJournalKind,
  type StudioJournalTag,
  type StudioPathway,
  type StudioArtistPortfolioExample,
  type StudioArtistProcessDisclosure,
  type StudioProgrammeStatus,
  type StudioProjectStatus,
} from "./types";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function text(form: FormData, key: string, max: number): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().replace(/\r\n/g, "\n").slice(0, max) : "";
}

export function parseStudioCommunityShare(form: FormData): ValidationResult<{
  audience: StudioCommunityAudience;
  topic: StudioCommunityTopic;
  deliberateShareConfirmed: boolean;
  publicVisibilityConfirmed: boolean;
}> {
  const audience = choice(text(form, "audience", 20), STUDIO_COMMUNITY_AUDIENCES);
  const topic = choice(text(form, "topic", 40), STUDIO_COMMUNITY_TOPICS);
  if (!audience) return { ok: false, error: "Choose who may read the community copy." };
  if (!topic) return { ok: false, error: "Choose a Deck Creation topic." };
  if (form.get("confirm_deliberate_share") !== "on") {
    return { ok: false, error: "Confirm that you are deliberately creating a separate community copy." };
  }
  const publicVisibilityConfirmed = form.get("confirm_public_visibility") === "on";
  if (audience === "public" && !publicVisibilityConfirmed) {
    return { ok: false, error: "Confirm that the public copy may be indexed by search engines." };
  }
  return {
    ok: true,
    value: {
      audience,
      topic,
      deliberateShareConfirmed: true,
      publicVisibilityConfirmed,
    },
  };
}

export function parseStudioJournalExcerpt(form: FormData): ValidationResult<{
  purpose: StudioExcerptPurpose;
  title: string;
  excerpt_text: string;
  photo_id: string | null;
}> {
  const purpose = choice(text(form, "purpose", 30), STUDIO_EXCERPT_PURPOSES);
  const title = text(form, "excerpt_title", 160);
  const excerptText = text(form, "excerpt_text", 5000);
  const photoId = optionalUuid(text(form, "photo_id", 50));
  if (!purpose) return { ok: false, error: "Choose a valid excerpt purpose." };
  if (!title) return { ok: false, error: "Give the controlled excerpt a title." };
  if (!excerptText) return { ok: false, error: "Add the text you intend to export." };
  if (photoId === undefined) return { ok: false, error: "Choose a valid journal photograph." };
  if (form.get("confirm_controlled_copy") !== "on") {
    return { ok: false, error: "Confirm that this is a separate controlled copy." };
  }
  return { ok: true, value: { purpose, title, excerpt_text: excerptText, photo_id: photoId } };
}

function choice<T extends string>(value: string, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function orderValue(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 && number <= 999 ? number : null;
}

function optionalUuid(value: string): string | null | undefined {
  if (!value) return null;
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

function commaList(form: FormData, key: string, maxItems: number): string[] {
  return [...new Set(text(form, key, 1200).split(",").map((item) => item.trim()).filter(Boolean))].slice(0, maxItems);
}

function publicHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function parseStudioArtistApplication(form: FormData): ValidationResult<{
  professional_name: string;
  location: string;
  time_zone: string;
  languages: string[];
  biography: string;
  artistic_statement: string;
  mediums: string[];
  techniques: string[];
  styles: string[];
  subjects: string[];
  publishing_experience: string;
  availability: string;
  budget_approach: string;
  licensing_preferences: string;
  collaboration_models: string[];
  process_disclosure: StudioArtistProcessDisclosure;
  portfolio_examples: StudioArtistPortfolioExample[];
  contact_email: string;
  website_url: string;
}> {
  const professionalName = text(form, "professional_name", 120);
  const biography = text(form, "biography", 3000);
  const artisticStatement = text(form, "artistic_statement", 3000);
  const availability = text(form, "availability", 1200);
  const budgetApproach = text(form, "budget_approach", 1200);
  const licensingPreferences = text(form, "licensing_preferences", 1200);
  const languages = commaList(form, "languages", 12);
  const mediums = commaList(form, "mediums", 16);
  const techniques = commaList(form, "techniques", 16);
  const styles = commaList(form, "styles", 16);
  const subjects = commaList(form, "subjects", 16);
  const collaborationModels = commaList(form, "collaboration_models", 8);
  const processDisclosure = choice(text(form, "process_disclosure", 40), STUDIO_ARTIST_PROCESS_DISCLOSURES);
  const contactEmail = text(form, "contact_email", 254).toLowerCase();
  const websiteValue = text(form, "website_url", 500);
  const websiteUrl = websiteValue ? publicHttpUrl(websiteValue) : "";
  const portfolioExamples: StudioArtistPortfolioExample[] = [];

  for (let index = 1; index <= 8; index += 1) {
    const rawUrl = text(form, `portfolio_url_${index}`, 500);
    const title = text(form, `portfolio_title_${index}`, 160);
    const description = text(form, `portfolio_description_${index}`, 500);
    if (!rawUrl && !title && !description) continue;
    const url = publicHttpUrl(rawUrl);
    if (!url || !title) return { ok: false, error: `Check portfolio example ${index}. Add a public web link and title.` };
    portfolioExamples.push({ url, title, description });
  }

  if (professionalName.length < 2) return { ok: false, error: "Add your professional name." };
  if (biography.length < 40 || artisticStatement.length < 40) return { ok: false, error: "Add a biography and artistic statement of at least 40 characters each." };
  if (!languages.length || !mediums.length || !styles.length || !collaborationModels.length) return { ok: false, error: "Add languages, mediums, styles and collaboration models." };
  if (availability.length < 10 || budgetApproach.length < 10 || licensingPreferences.length < 10) return { ok: false, error: "Explain your availability, budget approach and licensing preferences." };
  if (!processDisclosure) return { ok: false, error: "Choose the disclosure that accurately describes your creative process." };
  if (portfolioExamples.length < 6 || portfolioExamples.length > 8) return { ok: false, error: "Provide between six and eight portfolio examples." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) return { ok: false, error: "Add a valid private contact email." };
  if (websiteValue && !websiteUrl) return { ok: false, error: "Check the website address." };
  if (form.get("display_rights_confirmed") !== "on") return { ok: false, error: "Confirm that Tides of Knowing may display the submitted portfolio examples while your profile is approved." };

  return { ok: true, value: {
    professional_name: professionalName,
    location: text(form, "location", 160),
    time_zone: text(form, "time_zone", 80),
    languages,
    biography,
    artistic_statement: artisticStatement,
    mediums,
    techniques,
    styles,
    subjects,
    publishing_experience: text(form, "publishing_experience", 2000),
    availability: availability,
    budget_approach: budgetApproach,
    licensing_preferences: licensingPreferences,
    collaboration_models: collaborationModels,
    process_disclosure: processDisclosure,
    portfolio_examples: portfolioExamples,
    contact_email: contactEmail,
    website_url: websiteUrl ?? "",
  } };
}

export function parseStudioArtistIntroduction(form: FormData): ValidationResult<{
  project_id: string;
  artist_profile_id: string;
  brief: string;
  timeline: string;
  budget_context: string;
}> {
  const projectId = optionalUuid(text(form, "project_id", 50));
  const artistProfileId = optionalUuid(text(form, "artist_profile_id", 50));
  const brief = text(form, "brief", 5000);
  if (!projectId || !artistProfileId) return { ok: false, error: "Choose a valid project and artist." };
  if (brief.length < 50) return { ok: false, error: "Give the artist a clear brief of at least 50 characters." };
  if (form.get("direct_contract_confirmed") !== "on") return { ok: false, error: "Confirm that contracts and payments remain directly between creator and artist." };
  return { ok: true, value: {
    project_id: projectId,
    artist_profile_id: artistProfileId,
    brief,
    timeline: text(form, "timeline", 800),
    budget_context: text(form, "budget_context", 800),
  } };
}

export function parseStudioProjectCreate(form: FormData): ValidationResult<{
  name: string;
  deck_type: StudioDeckType;
  pathway: StudioPathway;
  deck_size: number | null;
  purpose: string;
}> {
  const name = text(form, "name", 120);
  const deckType = choice(text(form, "deck_type", 20), STUDIO_DECK_TYPES);
  const pathway = choice(text(form, "pathway", 20), STUDIO_PATHWAYS);
  const deckSizeRaw = text(form, "deck_size", 3);
  const deckSize = deckSizeRaw ? Number(deckSizeRaw) : null;

  if (name.length < 2) return { ok: false, error: "Give the project a name." };
  if (!deckType) return { ok: false, error: "Choose a valid deck type." };
  if (!pathway) return { ok: false, error: "Choose a valid creator pathway." };
  if (deckSize !== null && (!Number.isInteger(deckSize) || deckSize < 1 || deckSize > 240)) {
    return { ok: false, error: "Deck size must be between 1 and 240 cards." };
  }

  return {
    ok: true,
    value: {
      name,
      deck_type: deckType,
      pathway,
      deck_size: deckSize,
      purpose: text(form, "purpose", 1200),
    },
  };
}

export function parseStudioProjectUpdate(form: FormData): ValidationResult<{
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
}> {
  const created = parseStudioProjectCreate(form);
  if (!created.ok) return created;
  const status = choice(text(form, "status", 20), STUDIO_PROJECT_STATUSES);
  if (!status) return { ok: false, error: "Choose a valid project status." };

  return {
    ok: true,
    value: {
      ...created.value,
      status,
      intended_reader: text(form, "intended_reader", 1200),
      promise: text(form, "promise", 1200),
      description: text(form, "description", 5000),
      next_action: text(form, "next_action", 1200),
      current_risk: text(form, "current_risk", 1200),
    },
  };
}

export function parseStudioCardCreate(form: FormData): ValidationResult<{
  title: string;
  card_number: string;
  sort_order: number;
  family_id: string | null;
}> {
  const title = text(form, "title", 120);
  const sortOrder = orderValue(text(form, "sort_order", 3));
  const familyId = text(form, "family_id", 50) || null;
  if (!title) return { ok: false, error: "Give the card a title." };
  if (sortOrder === null) return { ok: false, error: "Card order must be between 0 and 999." };
  return {
    ok: true,
    value: {
      title,
      card_number: text(form, "card_number", 30),
      sort_order: sortOrder,
      family_id: familyId,
    },
  };
}

export function parseStudioCardFamilyCreate(form: FormData): ValidationResult<{
  name: string;
  description: string;
  sort_order: number;
}> {
  const name = text(form, "name", 80);
  const sortOrder = orderValue(text(form, "sort_order", 3));
  if (!name) return { ok: false, error: "Give the card family a name." };
  if (sortOrder === null) return { ok: false, error: "Family order must be between 0 and 999." };
  return { ok: true, value: { name, description: text(form, "description", 1000), sort_order: sortOrder } };
}

const CARD_CONTENT_FIELDS = [
  "meaning",
  "shadow_meaning",
  "symbolism",
  "correspondences",
  "prompts",
  "keywords",
  "cautions",
  "research_notes",
  "sources",
  "cultural_context",
  "permissions",
  "artwork_brief",
  "rights_status",
  "production_notes",
] as const;

export function parseStudioCardUpdate(form: FormData): ValidationResult<{
  title: string;
  card_number: string;
  sort_order: number;
  status: StudioItemStatus;
  family_id: string | null;
  content: Record<string, string>;
}> {
  const created = parseStudioCardCreate(form);
  if (!created.ok) return created;
  const status = choice(text(form, "status", 20), STUDIO_ITEM_STATUSES);
  if (!status) return { ok: false, error: "Choose a valid card status." };

  const content = Object.fromEntries(CARD_CONTENT_FIELDS.map((field) => [field, text(form, field, 20000)]));
  return { ok: true, value: { ...created.value, status, content } };
}

export function parseStudioGuidebookCreate(form: FormData): ValidationResult<{
  title: string;
  section_type: StudioGuidebookType;
  sort_order: number;
  card_id: string | null;
}> {
  const title = text(form, "title", 160);
  const sectionType = choice(text(form, "section_type", 30), STUDIO_GUIDEBOOK_TYPES);
  const sortOrder = orderValue(text(form, "sort_order", 3));
  const cardId = optionalUuid(text(form, "card_id", 50));
  if (!title) return { ok: false, error: "Give the guidebook section a title." };
  if (!sectionType) return { ok: false, error: "Choose a valid guidebook section type." };
  if (sortOrder === null) return { ok: false, error: "Section order must be between 0 and 999." };
  if (cardId === undefined) return { ok: false, error: "Choose a valid card to link." };
  return { ok: true, value: { title, section_type: sectionType, sort_order: sortOrder, card_id: cardId } };
}

export function parseStudioGuidebookUpdate(form: FormData): ValidationResult<{
  title: string;
  section_type: StudioGuidebookType;
  sort_order: number;
  card_id: string | null;
  status: StudioItemStatus;
  body_markdown: string;
}> {
  const created = parseStudioGuidebookCreate(form);
  if (!created.ok) return created;
  const status = choice(text(form, "status", 20), STUDIO_ITEM_STATUSES);
  if (!status) return { ok: false, error: "Choose a valid guidebook status." };
  return {
    ok: true,
    value: {
      ...created.value,
      status,
      body_markdown: text(form, "body_markdown", 200000),
    },
  };
}

export function parseStudioJournalEntry(form: FormData): ValidationResult<{
  entry_kind: StudioJournalKind;
  title: string;
  body_markdown: string;
  tags: StudioJournalTag[];
  linked_card_id: string | null;
  linked_section_id: string | null;
  selected_for_process: boolean;
}> {
  const entryKind = choice(text(form, "entry_kind", 20), STUDIO_JOURNAL_KINDS);
  const title = text(form, "title", 160);
  const linkedCardId = optionalUuid(text(form, "linked_card_id", 50));
  const linkedSectionId = optionalUuid(text(form, "linked_section_id", 50));
  const rawTags = form.getAll("tags")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim());
  const invalidTag = rawTags.find((value) => !STUDIO_JOURNAL_TAGS.includes(value as StudioJournalTag));
  const tags = [...new Set(
    rawTags.filter((value): value is StudioJournalTag => STUDIO_JOURNAL_TAGS.includes(value as StudioJournalTag)),
  )];

  if (!entryKind) return { ok: false, error: "Choose a valid journal entry type." };
  if (!title) return { ok: false, error: "Give the journal entry a title." };
  if (invalidTag) return { ok: false, error: "Choose valid journal tags." };
  if (linkedCardId === undefined) return { ok: false, error: "Choose a valid linked card." };
  if (linkedSectionId === undefined) return { ok: false, error: "Choose a valid linked guidebook section." };

  return {
    ok: true,
    value: {
      entry_kind: entryKind,
      title,
      body_markdown: text(form, "body_markdown", 50000),
      tags,
      linked_card_id: linkedCardId,
      linked_section_id: linkedSectionId,
      selected_for_process: form.get("selected_for_process") === "on",
    },
  };
}

export function parseStudioProgrammeProgress(form: FormData): ValidationResult<{
  status: StudioProgrammeStatus;
  current_task: string;
  notes: string;
}> {
  const status = choice(text(form, "status", 20), STUDIO_PROGRAMME_STATUSES);
  if (!status) return { ok: false, error: "Choose a valid programme status." };
  return {
    ok: true,
    value: {
      status,
      current_task: text(form, "current_task", 2000),
      notes: text(form, "notes", 10000),
    },
  };
}
