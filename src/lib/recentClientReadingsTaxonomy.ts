export const RECENT_CLIENT_READING_TYPES = [
  "One Question",
  "In-Depth",
  "Personal Guidance",
] as const;

export const CLIENT_CONSENT_STATUSES = [
  "pending",
  "consented",
  "complimentary-publication-condition",
  "private",
] as const;

export const PUBLICATION_STATUSES = ["published", "draft", "private"] as const;

export const RECENT_CLIENT_LIFE_AREAS = [
  "Relationships",
  "Career",
  "Family",
  "Finance",
  "Spiritual Growth",
  "Creativity",
  "Business",
  "Health",
  "Grief",
  "Purpose",
  "Decision Making",
] as const;

export const RECENT_CLIENT_DOMINANT_SUITS = [
  "Cups",
  "Wands",
  "Swords",
  "Pentacles",
  "Major Arcana",
  "Mixed",
] as const;

export const RECENT_CLIENT_SPREADS = [
  "One Question",
  "Celtic Cross",
  "Twelve Month Timeline",
  "Custom",
] as const;

export const RECENT_CLIENT_ARCHETYPAL_THEMES = [
  "Beginning",
  "Transition",
  "Conflict",
  "Integration",
  "Completion",
  "Transformation",
  "Discernment",
  "Threshold",
  "Healing",
  "Reorientation",
] as const;

export type RecentClientReadingType = (typeof RECENT_CLIENT_READING_TYPES)[number];
export type RecentClientPublicationStatus = (typeof PUBLICATION_STATUSES)[number];
