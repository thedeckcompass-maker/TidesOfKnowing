import type { CollectionEntry } from "astro:content";
import {
  REPEATING_CARD_RELATED_MAP,
  type RepeatingCardRelatedRef,
  type RepeatingCardRelationshipType,
} from "../data/repeating-card-related-map";
import {
  getRepeatingCardEntry,
  isRepeatingMeaningReady,
  repeatingCardDisplayTitle,
  repeatingCardPanelSummary,
  repeatingCardSlugFromId,
} from "./repeatingCardMeanings";
import { trimMetaDescription } from "./repeatingCardSeo";
import { getRepeatingCardSeoPath } from "./repeatingCardUrls";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

export const REPEATING_CARD_RELATED_MIN = 3;
export const REPEATING_CARD_RELATED_MAX = 6;

const RELATIONSHIP_LABELS: Record<RepeatingCardRelationshipType, string> = {
  "same-theme": "Shares core theme",
  progressive: "Progressive pattern",
  "shadow-pair": "Shadow pair",
  "suit-companion": "Suit companion",
  "archetypal-mirror": "Archetypal mirror",
  "resolving-pair": "Resolving pair",
};

export type RepeatingCardRelatedLink = {
  collectionId: string;
  title: string;
  href: string;
  relationshipType: RepeatingCardRelationshipType;
  relationshipLabel: string;
  summary: string | null;
};

export function getRepeatingCardRelationshipLabel(
  type: RepeatingCardRelationshipType,
): string {
  return RELATIONSHIP_LABELS[type];
}

/** Governed related-card refs for a collection id (`majors/the-fool`). */
export function getRepeatingCardRelatedRefs(
  collectionId: string,
): readonly RepeatingCardRelatedRef[] {
  return REPEATING_CARD_RELATED_MAP[collectionId] ?? [];
}

function fallbackTitleFromId(collectionId: string): string {
  return repeatingCardSlugFromId(collectionId)
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * Resolve governed related cards for a canonical entity page.
 * Filters to ready entries, removes self-links and duplicate targets, caps at 6.
 */
export function resolveRepeatingCardRelatedLinks(
  entry: RepeatingCardEntry,
  byId: Map<string, RepeatingCardEntry>,
): RepeatingCardRelatedLink[] {
  const refs = getRepeatingCardRelatedRefs(entry.id);
  if (refs.length === 0) return [];

  const selfSlug = repeatingCardSlugFromId(entry.id);
  const seenSlugs = new Set<string>();
  const links: RepeatingCardRelatedLink[] = [];

  for (const ref of refs) {
    if (links.length >= REPEATING_CARD_RELATED_MAX) break;

    const target = getRepeatingCardEntry(byId, ref.card);
    if (!target || !isRepeatingMeaningReady(target)) continue;

    const slug = repeatingCardSlugFromId(target.id);
    if (slug === selfSlug || seenSlugs.has(slug)) continue;

    seenSlugs.add(slug);
    const title = repeatingCardDisplayTitle(target, fallbackTitleFromId(target.id));
    const summaryRaw = repeatingCardPanelSummary(target);
    const summary = summaryRaw ? trimMetaDescription(summaryRaw, 140) : null;

    links.push({
      collectionId: target.id,
      title,
      href: getRepeatingCardSeoPath(slug),
      relationshipType: ref.relationship_type,
      relationshipLabel: getRepeatingCardRelationshipLabel(ref.relationship_type),
      summary,
    });
  }

  return links;
}
