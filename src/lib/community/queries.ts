import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMMUNITY_POSTS_PER_PAGE,
  totalCommunityPages,
  type CommunityListMode,
} from "./pagination";
import type {
  CommunityPostDetail,
  CommunityPostSummary,
  CommunityReplyDetail,
  CommunitySection,
  CommunitySectionKey,
  NotificationPreferences,
} from "./types";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function replyCount(row: Record<string, unknown>): number {
  const replies = row.replies;
  if (Array.isArray(replies)) {
    const first = replies[0] as { count?: number } | undefined;
    return Number(first?.count ?? 0);
  }
  return 0;
}

function normalizeSummary(row: Record<string, unknown>): CommunityPostSummary {
  return {
    ...(row as unknown as CommunityPostSummary),
    section: one(row.section as CommunityPostSummary["section"] | CommunityPostSummary["section"][]),
    author: one(row.author as CommunityPostSummary["author"] | CommunityPostSummary["author"][]),
    reply_count: replyCount(row),
  };
}

export async function getCommunitySections(
  supabase: SupabaseClient,
): Promise<CommunitySection[]> {
  const { data, error } = await supabase
    .from("community_sections")
    .select("id, key, name, description, display_order, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Unable to load community sections:", error);
    return [];
  }

  return (data ?? []) as CommunitySection[];
}

export async function getSectionByKey(
  supabase: SupabaseClient,
  key: CommunitySectionKey,
): Promise<CommunitySection | null> {
  const { data, error } = await supabase
    .from("community_sections")
    .select("id, key, name, description, display_order, is_active")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Unable to load community section:", error);
    return null;
  }

  return (data as CommunitySection | null) ?? null;
}

export async function getCommunityPosts(
  supabase: SupabaseClient,
  options: {
    mode: CommunityListMode;
    page: number;
  },
): Promise<{
  posts: CommunityPostSummary[];
  totalCount: number;
  totalPages: number;
}> {
  const page = Math.max(1, options.page);
  const from = (page - 1) * COMMUNITY_POSTS_PER_PAGE;
  const to = from + COMMUNITY_POSTS_PER_PAGE - 1;

  let query = supabase
    .from("community_posts")
    .select(
      `
        id,
        section_id,
        author_id,
        title,
        slug,
        body,
        post_type,
        image_url,
        status,
        is_pinned,
        pinned_at,
        created_at,
        updated_at,
        deleted_at,
        section:community_sections!inner(key, name),
        author:profiles(display_name),
        replies:community_replies(count)
      `,
      { count: "exact" },
    )
    .eq("status", "published");

  if (options.mode.kind === "section") {
    query = query.eq("community_sections.key", options.mode.sectionKey);
  }

  if (options.mode.kind === "search" && options.mode.query.trim()) {
    query = query.textSearch("search_vector", options.mode.query.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  const { data, count, error } = await query
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Unable to load community posts:", error);
    return { posts: [], totalCount: 0, totalPages: 1 };
  }

  const totalCount = count ?? 0;
  return {
    posts: ((data ?? []) as Record<string, unknown>[]).map(normalizeSummary),
    totalCount,
    totalPages: totalCommunityPages(totalCount),
  };
}

export async function getCommunityPostBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<CommunityPostDetail | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .select(
      `
        id,
        section_id,
        author_id,
        title,
        slug,
        body,
        post_type,
        image_url,
        status,
        is_pinned,
        pinned_at,
        created_at,
        updated_at,
        deleted_at,
        section:community_sections(id, key, name, description, display_order, is_active),
        author:profiles(id, display_name, role)
      `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Unable to load community post:", error);
    return null;
  }

  if (!data) return null;

  const row = data as unknown as Record<string, unknown>;
  return {
    ...(row as unknown as CommunityPostDetail),
    section: one(row.section as CommunityPostDetail["section"] | CommunityPostDetail["section"][]),
    author: one(row.author as CommunityPostDetail["author"] | CommunityPostDetail["author"][]),
  };
}

export async function getCommunityReplies(
  supabase: SupabaseClient,
  postId: string,
): Promise<CommunityReplyDetail[]> {
  const { data, error } = await supabase
    .from("community_replies")
    .select(
      `
        id,
        post_id,
        author_id,
        body,
        status,
        created_at,
        updated_at,
        deleted_at,
        author:profiles(id, display_name, role)
      `,
    )
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to load community replies:", error);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...(row as unknown as CommunityReplyDetail),
    author: one(row.author as CommunityReplyDetail["author"] | CommunityReplyDetail["author"][]),
  }));
}

export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("user_id, email_replies_to_posts, email_announcements, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load notification preferences:", error);
    return null;
  }

  return (data as NotificationPreferences | null) ?? null;
}
