import type { SupabaseClient } from "@supabase/supabase-js";
import { createPostSlug } from "./slugs";
import type {
  CommunityProfileStatus,
  CommunitySectionKey,
  ReadingPracticePostType,
} from "./types";

type MutationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; status?: number };

async function loadPost(service: SupabaseClient, postId: string) {
  const { data, error } = await service
    .from("community_posts")
    .select("id, author_id, title, slug, status, is_pinned")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load post for mutation:", error);
    return null;
  }

  return data as
    | {
        id: string;
        author_id: string;
        title: string;
        slug: string;
        status: string;
        is_pinned: boolean;
      }
    | null;
}

async function loadReply(service: SupabaseClient, replyId: string) {
  const { data, error } = await service
    .from("community_replies")
    .select("id, author_id, post_id, status")
    .eq("id", replyId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load reply for mutation:", error);
    return null;
  }

  return data as
    | {
        id: string;
        author_id: string;
        post_id: string;
        status: string;
      }
    | null;
}

export async function createCommunityPost(
  service: SupabaseClient,
  input: {
    authorId: string;
    sectionKey: CommunitySectionKey;
    title: string;
    body: string;
    postType: ReadingPracticePostType | null;
    imageUrl?: string | null;
  },
): Promise<MutationResult<{ id: string; slug: string }>> {
  const { data: section, error: sectionError } = await service
    .from("community_sections")
    .select("id")
    .eq("key", input.sectionKey)
    .eq("is_active", true)
    .maybeSingle();

  if (sectionError || !section) {
    return { ok: false, error: "That Practice Commons section is not available.", status: 400 };
  }

  const slug = createPostSlug(input.title);
  const { data, error } = await service
    .from("community_posts")
    .insert({
      author_id: input.authorId,
      section_id: (section as { id: string }).id,
      title: input.title,
      body: input.body,
      post_type: input.postType,
      image_url: input.imageUrl ?? null,
      slug,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Unable to create community post:", error);
    return { ok: false, error: "Unable to create the post right now.", status: 500 };
  }

  return { ok: true, value: data as { id: string; slug: string } };
}

export async function updateCommunityPost(
  service: SupabaseClient,
  input: {
    postId: string;
    userId: string;
    isAdmin: boolean;
    title: string;
    body: string;
    postType: ReadingPracticePostType | null;
  },
): Promise<MutationResult<{ slug: string }>> {
  const post = await loadPost(service, input.postId);
  if (!post || post.status === "deleted") {
    return { ok: false, error: "Post not found.", status: 404 };
  }

  if (!input.isAdmin && post.author_id !== input.userId) {
    return { ok: false, error: "You can only edit your own posts.", status: 403 };
  }

  if (!input.isAdmin && post.status !== "published") {
    return { ok: false, error: "This post cannot be edited.", status: 403 };
  }

  const { error } = await service
    .from("community_posts")
    .update({
      title: input.title,
      body: input.body,
      post_type: input.postType,
    })
    .eq("id", input.postId);

  if (error) {
    console.error("Unable to update community post:", error);
    return { ok: false, error: "Unable to update the post right now.", status: 500 };
  }

  return { ok: true, value: { slug: post.slug } };
}

export async function createCommunityReply(
  service: SupabaseClient,
  input: {
    postId: string;
    authorId: string;
    body: string;
  },
): Promise<MutationResult<{ id: string; postAuthorId: string; postSlug: string }>> {
  const post = await loadPost(service, input.postId);
  if (!post || post.status !== "published") {
    return { ok: false, error: "Post not found.", status: 404 };
  }

  const { data, error } = await service
    .from("community_replies")
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Unable to create community reply:", error);
    return { ok: false, error: "Unable to add the reply right now.", status: 500 };
  }

  return {
    ok: true,
    value: {
      id: (data as { id: string }).id,
      postAuthorId: post.author_id,
      postSlug: post.slug,
    },
  };
}

export async function updateCommunityReply(
  service: SupabaseClient,
  input: {
    replyId: string;
    userId: string;
    isAdmin: boolean;
    body: string;
  },
): Promise<MutationResult<{ postId: string }>> {
  const reply = await loadReply(service, input.replyId);
  if (!reply || reply.status === "deleted") {
    return { ok: false, error: "Reply not found.", status: 404 };
  }

  if (!input.isAdmin && reply.author_id !== input.userId) {
    return { ok: false, error: "You can only edit your own replies.", status: 403 };
  }

  const { error } = await service
    .from("community_replies")
    .update({ body: input.body })
    .eq("id", input.replyId);

  if (error) {
    console.error("Unable to update community reply:", error);
    return { ok: false, error: "Unable to update the reply right now.", status: 500 };
  }

  return { ok: true, value: { postId: reply.post_id } };
}

export async function setPostPinned(
  service: SupabaseClient,
  input: { adminId: string; postId: string; pinned: boolean; reason?: string },
): Promise<MutationResult<null>> {
  const { error } = await service
    .from("community_posts")
    .update({
      is_pinned: input.pinned,
      pinned_at: input.pinned ? new Date().toISOString() : null,
    })
    .eq("id", input.postId);

  if (error) {
    console.error("Unable to update pinned state:", error);
    return { ok: false, error: "Unable to update the post.", status: 500 };
  }

  await service.from("moderation_actions").insert({
    admin_user_id: input.adminId,
    post_id: input.postId,
    action: input.pinned ? "pin_post" : "unpin_post",
    reason: input.reason ?? null,
  });

  return { ok: true, value: null };
}

export async function setPostStatus(
  service: SupabaseClient,
  input: {
    adminId: string;
    postId: string;
    status: "published" | "hidden" | "deleted" | "locked";
    reason?: string;
  },
): Promise<MutationResult<null>> {
  const { error } = await service
    .from("community_posts")
    .update({
      status: input.status,
      deleted_at: input.status === "deleted" ? new Date().toISOString() : null,
    })
    .eq("id", input.postId);

  if (error) {
    console.error("Unable to moderate post:", error);
    return { ok: false, error: "Unable to moderate the post.", status: 500 };
  }

  await service.from("moderation_actions").insert({
    admin_user_id: input.adminId,
    post_id: input.postId,
    action: input.status === "published" ? "restore_post" : input.status === "deleted" ? "delete_post" : "hide_post",
    reason: input.reason ?? null,
  });

  return { ok: true, value: null };
}

export async function setReplyStatus(
  service: SupabaseClient,
  input: {
    adminId: string;
    replyId: string;
    status: "published" | "hidden" | "deleted";
    reason?: string;
  },
): Promise<MutationResult<null>> {
  const { error } = await service
    .from("community_replies")
    .update({
      status: input.status,
      deleted_at: input.status === "deleted" ? new Date().toISOString() : null,
    })
    .eq("id", input.replyId);

  if (error) {
    console.error("Unable to moderate reply:", error);
    return { ok: false, error: "Unable to moderate the reply.", status: 500 };
  }

  await service.from("moderation_actions").insert({
    admin_user_id: input.adminId,
    reply_id: input.replyId,
    action: input.status === "published" ? "restore_reply" : input.status === "deleted" ? "delete_reply" : "hide_reply",
    reason: input.reason ?? null,
  });

  return { ok: true, value: null };
}

export async function setProfileStatus(
  service: SupabaseClient,
  input: {
    adminId: string;
    targetUserId: string;
    status: CommunityProfileStatus;
    reason?: string;
  },
): Promise<MutationResult<null>> {
  const { error } = await service
    .from("profiles")
    .update({ status: input.status })
    .eq("id", input.targetUserId);

  if (error) {
    console.error("Unable to moderate profile:", error);
    return { ok: false, error: "Unable to update the member.", status: 500 };
  }

  const action =
    input.status === "blocked"
      ? "block_user"
      : input.status === "restricted"
        ? "restrict_user"
        : "restore_user";

  await service.from("moderation_actions").insert({
    admin_user_id: input.adminId,
    target_user_id: input.targetUserId,
    action,
    reason: input.reason ?? null,
  });

  return { ok: true, value: null };
}
