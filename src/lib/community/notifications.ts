import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { communityEnv } from "./env";
import { communityPostPath } from "./slugs";

type NotificationResult = { ok: true } | { ok: false; error: string };

export async function sendReplyNotification(
  service: SupabaseClient,
  input: {
    recipientUserId: string;
    replyId: string;
    postId: string;
    postSlug: string;
    actorUserId: string;
    origin: string;
    locals?: unknown;
  },
): Promise<NotificationResult> {
  if (input.recipientUserId === input.actorUserId) {
    return { ok: true };
  }

  const { data: preferences } = await service
    .from("notification_preferences")
    .select("email_replies_to_posts")
    .eq("user_id", input.recipientUserId)
    .maybeSingle();

  if (preferences && preferences.email_replies_to_posts === false) {
    await service.from("notification_events").insert({
      recipient_user_id: input.recipientUserId,
      post_id: input.postId,
      reply_id: input.replyId,
      event_type: "reply_to_post",
      status: "skipped",
    });
    return { ok: true };
  }

  const eventInsert = await service
    .from("notification_events")
    .insert({
      recipient_user_id: input.recipientUserId,
      post_id: input.postId,
      reply_id: input.replyId,
      event_type: "reply_to_post",
      status: "queued",
    })
    .select("id")
    .single();

  const eventId = (eventInsert.data as { id?: string } | null)?.id;

  const {
    data: { user },
    error: userError,
  } = await service.auth.admin.getUserById(input.recipientUserId);

  const email = user?.email;
  const env = communityEnv(input.locals);

  if (userError || !email || !env.emailApiKey) {
    if (eventId) {
      await service
        .from("notification_events")
        .update({
          status: "failed",
          attempt_count: 1,
          last_error: "Missing recipient email or email API key.",
        })
        .eq("id", eventId);
    }
    return { ok: false, error: "Notification email is not configured." };
  }

  const postUrl = new URL(communityPostPath(input.postSlug), input.origin).href;
  const resend = new Resend(env.emailApiKey);
  const sendResult = await resend.emails.send({
    from: "Tides of Knowing <hello@tidesofknowing.com>",
    to: email,
    subject: "A reader replied to your Practice Commons post",
    text: [
      "A reader replied to your Practice Commons post.",
      "",
      "You can return to the conversation here:",
      postUrl,
      "",
      "You can adjust community email preferences from your Practice Commons account page.",
    ].join("\n"),
  });

  if (sendResult.error) {
    if (eventId) {
      await service
        .from("notification_events")
        .update({
          status: "failed",
          attempt_count: 1,
          last_error: sendResult.error.message,
        })
        .eq("id", eventId);
    }
    return { ok: false, error: "Unable to send notification email." };
  }

  if (eventId) {
    await service
      .from("notification_events")
      .update({
        status: "sent",
        attempt_count: 1,
        sent_at: new Date().toISOString(),
      })
      .eq("id", eventId);
  }

  return { ok: true };
}
