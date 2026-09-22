import {
  STUDIO_DECK_TYPES,
  STUDIO_GUIDEBOOK_TYPES,
  STUDIO_ITEM_STATUSES,
  STUDIO_PATHWAYS,
  STUDIO_PROJECT_STATUSES,
  type StudioDeckType,
  type StudioGuidebookType,
  type StudioItemStatus,
  type StudioPathway,
  type StudioProjectStatus,
} from "./types";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function text(form: FormData, key: string, max: number): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().replace(/\r\n/g, "\n").slice(0, max) : "";
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
