import type { SupabaseClient } from "@supabase/supabase-js";
import { createPostSlug } from "./slugs";
import type {
  CommunityProfileStatus,
  CommunityReportReason,
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

async function loadReport(service: SupabaseClient, reportId: string) {
  const { data, error } = await service
    .from("community_reports")
    .select(
      `
        id,
        reporter_user_id,
        post_id,
        reply_id,
        status,
        post:community_posts(id, author_id),
        reply:community_replies(id, author_id, post_id)
      `,
    )
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load report for mutation:", error);
    return null;
  }

  return data as
    | {
        id: string;
        reporter_user_id: string;
        post_id: string | null;
        reply_id: string | null;
        status: string;
        post: { id: string; author_id: string } | { id: string; author_id: string }[] | null;
        reply:
          | { id: string; author_id: string; post_id: string }
          | { id: string; author_id: string; post_id: string }[]
          | null;
      }
    | null;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
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
    fieldNoteConsideration: boolean;
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
      field_note_consideration: input.fieldNoteConsideration,
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
    fieldNoteConsideration: boolean;
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
      field_note_consideration: input.fieldNoteConsideration,
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

export async function createCommunityReport(
  service: SupabaseClient,
  input: {
    reporterUserId: string;
    contentType: "post" | "reply";
    contentId: string;
    reason: CommunityReportReason;
    notes: string | null;
  },
): Promise<MutationResult<null>> {
  if (input.contentType === "post") {
    const { data: post, error: postError } = await service
      .from("community_posts")
      .select("id, status")
      .eq("id", input.contentId)
      .in("status", ["published", "locked"])
      .maybeSingle();

    if (postError || !post) {
      return { ok: false, error: "That discussion is not available to report.", status: 404 };
    }
  }

  if (input.contentType === "reply") {
    const { data: reply, error: replyError } = await service
      .from("community_replies")
      .select("id, status, post:community_posts!inner(status)")
      .eq("id", input.contentId)
      .eq("status", "published")
      .in("community_posts.status", ["published", "locked"])
      .maybeSingle();

    if (replyError || !reply) {
      return { ok: false, error: "That reply is not available to report.", status: 404 };
    }
  }

  const { error } = await service.from("community_reports").insert({
    reporter_user_id: input.reporterUserId,
    post_id: input.contentType === "post" ? input.contentId : null,
    reply_id: input.contentType === "reply" ? input.contentId : null,
    reason: input.reason,
    notes: input.notes,
  });

  if (error) {
    console.error("Unable to create community report:", error);
    return { ok: false, error: "Unable to send this report right now.", status: 500 };
  }

  return { ok: true, value: null };
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
  input: { adminId: string; postId: string; pinned: boolean; reason?: string; reportId?: string },
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
    report_id: input.reportId ?? null,
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
    reportId?: string;
    action?: "restore_post" | "hide_post" | "delete_post" | "lock_post" | "unlock_post";
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
    report_id: input.reportId ?? null,
    action: input.action ?? (input.status === "published"
        ? "restore_post"
        : input.status === "deleted"
          ? "delete_post"
          : input.status === "locked"
            ? "lock_post"
            : "hide_post"),
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
    reportId?: string;
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
    report_id: input.reportId ?? null,
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
    reportId?: string;
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
    report_id: input.reportId ?? null,
    action,
    reason: input.reason ?? null,
  });

  return { ok: true, value: null };
}

export async function markReportReviewed(
  service: SupabaseClient,
  input: {
    adminId: string;
    reportId: string;
    status: "dismissed" | "actioned";
    reason?: string;
    logDismissal?: boolean;
  },
): Promise<MutationResult<null>> {
  const { error } = await service
    .from("community_reports")
    .update({
      status: input.status,
      reviewed_by: input.adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.reportId);

  if (error) {
    console.error("Unable to update community report:", error);
    return { ok: false, error: "Unable to update the report.", status: 500 };
  }

  if (input.logDismissal) {
    await service.from("moderation_actions").insert({
      admin_user_id: input.adminId,
      report_id: input.reportId,
      action: "dismiss_report",
      reason: input.reason ?? null,
    });
  }

  return { ok: true, value: null };
}

export async function moderateFromReport(
  service: SupabaseClient,
  input: {
    adminId: string;
    reportId: string;
    intent:
      | "dismiss"
      | "hide_post"
      | "delete_post"
      | "lock_post"
      | "hide_reply"
      | "delete_reply"
      | "restrict_member"
      | "block_member";
    reason?: string;
  },
): Promise<MutationResult<null>> {
  const report = await loadReport(service, input.reportId);
  if (!report || report.status !== "open") {
    return { ok: false, error: "Report not found.", status: 404 };
  }

  if (input.intent === "dismiss") {
    return markReportReviewed(service, {
      adminId: input.adminId,
      reportId: input.reportId,
      status: "dismissed",
      reason: input.reason,
      logDismissal: true,
    });
  }

  const post = one(report.post);
  const reply = one(report.reply);
  let result: MutationResult<null>;

  if (input.intent === "hide_post" || input.intent === "delete_post" || input.intent === "lock_post") {
    if (!report.post_id) return { ok: false, error: "This report is not for a discussion.", status: 400 };
    result = await setPostStatus(service, {
      adminId: input.adminId,
      postId: report.post_id,
      status: input.intent === "delete_post" ? "deleted" : input.intent === "lock_post" ? "locked" : "hidden",
      reason: input.reason,
      reportId: input.reportId,
    });
  } else if (input.intent === "hide_reply" || input.intent === "delete_reply") {
    if (!report.reply_id) return { ok: false, error: "This report is not for a reply.", status: 400 };
    result = await setReplyStatus(service, {
      adminId: input.adminId,
      replyId: report.reply_id,
      status: input.intent === "delete_reply" ? "deleted" : "hidden",
      reason: input.reason,
      reportId: input.reportId,
    });
  } else {
    const targetUserId = post?.author_id ?? reply?.author_id ?? null;
    if (!targetUserId) return { ok: false, error: "Unable to identify the reported member.", status: 400 };
    result = await setProfileStatus(service, {
      adminId: input.adminId,
      targetUserId,
      status: input.intent === "block_member" ? "blocked" : "restricted",
      reason: input.reason,
      reportId: input.reportId,
    });
  }

  if (!result.ok) return result;

  return markReportReviewed(service, {
    adminId: input.adminId,
    reportId: input.reportId,
    status: "actioned",
    reason: input.reason,
  });
}
