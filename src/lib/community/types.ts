import type { SupabaseClient, User } from "@supabase/supabase-js";

export type CommunitySectionKey = "reading-practice" | "reader-development";

export type CommunityRole = "member" | "admin";
export type CommunityProfileStatus = "active" | "restricted" | "blocked";
export type CommunityPostStatus = "published" | "hidden" | "deleted" | "locked";
export type CommunityReplyStatus = "published" | "hidden" | "deleted";
export type NotificationEventType = "reply_to_post" | "announcement";
export type ReadingPracticePostType =
  | "practice_reading"
  | "spread_feedback"
  | "card_combination"
  | "clarifier_question"
  | "repeating_cards"
  | "reading_dilemma";

export type CommunityProfile = {
  id: string;
  display_name: string;
  role: CommunityRole;
  status: CommunityProfileStatus;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
};

export type CommunitySection = {
  id: string;
  key: CommunitySectionKey;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
};

export type CommunityPost = {
  id: string;
  section_id: string;
  author_id: string;
  title: string;
  slug: string;
  body: string;
  post_type: ReadingPracticePostType | null;
  image_url: string | null;
  field_note_consideration: boolean;
  status: CommunityPostStatus;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CommunityReply = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  status: CommunityReplyStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NotificationPreferences = {
  user_id: string;
  email_replies_to_posts: boolean;
  email_announcements: boolean;
  created_at: string;
  updated_at: string;
};

export type CommunityPostSummary = CommunityPost & {
  section: Pick<CommunitySection, "key" | "name"> | null;
  author: Pick<CommunityProfile, "display_name"> | null;
  reply_count: number;
};

export type CommunityPostDetail = CommunityPost & {
  section: CommunitySection | null;
  author: Pick<CommunityProfile, "id" | "display_name" | "role"> | null;
};

export type CommunityReplyDetail = CommunityReply & {
  author: Pick<CommunityProfile, "id" | "display_name" | "role"> | null;
};

export type CommunityLocals = {
  supabase?: SupabaseClient;
  user?: User | null;
  profile?: CommunityProfile | null;
};

export const COMMUNITY_SECTIONS: {
  key: CommunitySectionKey;
  name: string;
  description: string;
}[] = [
  {
    key: "reading-practice",
    name: "Reading Practice",
    description:
      "Share cards, spread interpretations, difficult combinations, clarification questions, symbolic observations, and reading dilemmas.",
  },
  {
    key: "reader-development",
    name: "Reader Development",
    description:
      "Grow as a reader through intuition, ethics, confidence, journaling, boundaries, symbolic literacy, reflective practice, and trust in yourself.",
  },
];

export const READING_PRACTICE_POST_TYPES: {
  value: ReadingPracticePostType;
  label: string;
}[] = [
  { value: "practice_reading", label: "Practice Reading" },
  { value: "spread_feedback", label: "Spread Feedback" },
  { value: "card_combination", label: "Card Combination" },
  { value: "clarifier_question", label: "Clarifier Question" },
  { value: "repeating_cards", label: "Repeating Cards" },
  { value: "reading_dilemma", label: "Reading Dilemma" },
];

export function readingPracticePostTypeLabel(
  value: ReadingPracticePostType | null | undefined,
): string | null {
  return READING_PRACTICE_POST_TYPES.find((type) => type.value === value)?.label ?? null;
}

export const COMMUNITY_SECTION_FALLBACKS: CommunitySection[] = COMMUNITY_SECTIONS.map(
  (section, index) => ({
    id: section.key,
    key: section.key,
    name: section.name,
    description: section.description,
    display_order: index + 1,
    is_active: true,
  }),
);
