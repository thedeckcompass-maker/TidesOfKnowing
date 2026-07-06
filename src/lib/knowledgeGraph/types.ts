/** Entity kinds in the Tides of Knowing knowledge graph. */
export const KNOWLEDGE_GRAPH_ENTITY_KINDS = [
  "tarot-card",
  "suit",
  "numerology",
  "spread",
  "field-note",
  "client-reading",
] as const;

export type KnowledgeGraphEntityKind = (typeof KNOWLEDGE_GRAPH_ENTITY_KINDS)[number];

export type KnowledgeGraphLink = {
  kind: KnowledgeGraphEntityKind;
  /** Stable ref key within the entity kind (slug, spread label, etc.). */
  ref: string;
  title: string;
  description: string | null;
  href: string;
};

export type KnowledgeGraphSection = {
  kind: KnowledgeGraphEntityKind;
  heading: string;
  links: KnowledgeGraphLink[];
};

export type KnowledgeGraphExplore = {
  sections: KnowledgeGraphSection[];
  hasContent: boolean;
};

export const KNOWLEDGE_GRAPH_SECTION_HEADINGS: Record<KnowledgeGraphEntityKind, string> = {
  "tarot-card": "Related Tarot Cards",
  suit: "Related Suits",
  numerology: "Related Numerology",
  spread: "Related Spreads",
  "field-note": "Related Field Notes",
  "client-reading": "Related Client Readings",
};

/** Display order for Continue Exploring sections. */
export const KNOWLEDGE_GRAPH_SECTION_ORDER: KnowledgeGraphEntityKind[] = [
  "tarot-card",
  "suit",
  "numerology",
  "spread",
  "field-note",
  "client-reading",
];
