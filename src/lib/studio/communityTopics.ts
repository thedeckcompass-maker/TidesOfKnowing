/**
 * Deck Creator Studio Community: controlled conversation topics.
 *
 * Chapters describe WHERE a creator is in their journey.
 * Topics describe WHAT the discussion concerns.
 *
 * Shared by General and Private Community.
 * Stable keys must not change when labels are edited.
 */

export const COMMUNITY_TOPICS = [
  { id: 'purpose', label: 'Purpose & intention' },
  { id: 'audience', label: 'Audience & reader needs' },
  { id: 'originality', label: 'Originality & positioning' },
  { id: 'methodology', label: 'Methodology & practice' },
  { id: 'structure', label: 'Structure & relationships' },
  { id: 'symbolism', label: 'Symbolism & meaning' },
  { id: 'writing', label: 'Writing & interpretation' },
  { id: 'visual-design', label: 'Visual design & artwork' },
  { id: 'accessibility', label: 'Accessibility & usability' },
  { id: 'production', label: 'Production & materials' },
  { id: 'publishing', label: 'Publishing & distribution' },
  { id: 'business', label: 'Business & marketing' }
] as const;

export type CommunityTopic =
  (typeof COMMUNITY_TOPICS)[number]['id'];

export function isCommunityTopic(
  value: unknown
): value is CommunityTopic {
  return typeof value === 'string' &&
    COMMUNITY_TOPICS.some(topic => topic.id === value);
}

export function communityTopicLabel(
  id: string
): string {
  return COMMUNITY_TOPICS.find(
    topic => topic.id === id
  )?.label ?? 'Uncategorised';
}
