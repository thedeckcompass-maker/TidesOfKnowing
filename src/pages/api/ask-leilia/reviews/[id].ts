import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { json } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import {
  getAskLeiliaReviewById,
  setAskLeiliaReviewFeatured,
  updateAskLeiliaReviewModeration,
} from "../../../../lib/ask-leilia/reviews/queries";
import {
  isAskLeiliaReviewModerationStatus,
  isAskLeiliaReviewVerificationStatus,
} from "../../../../lib/ask-leilia/reviews/types";
import { validateAskLeiliaReviewAdminEdit } from "../../../../lib/ask-leilia/reviews/validation";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const reviewId = params.id;
  if (!reviewId) {
    return json({ ok: false, error: "Missing review id." }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const existing = await getAskLeiliaReviewById(service, reviewId);
  if (!existing) {
    return redirect("/ask-leilia/admin/reviews/?error=Review+not+found", 303);
  }

  const form = await request.formData();
  const action = String(form.get("action") ?? "").trim();

  if (action === "feature" || action === "unfeature") {
    const result = await setAskLeiliaReviewFeatured(
      service,
      reviewId,
      action === "feature",
    );
    if (!result.ok) {
      return redirect(
        `/ask-leilia/admin/reviews/?status=${existing.moderation_status}&error=${encodeURIComponent(result.error)}`,
        303,
      );
    }
    return redirect(
      `/ask-leilia/admin/reviews/?status=${existing.moderation_status}&saved=1`,
      303,
    );
  }

  if (action === "save_public") {
    const edited = validateAskLeiliaReviewAdminEdit({
      displayName: form.get("displayName"),
      bodyPublic: form.get("bodyPublic"),
      title: form.get("title"),
    });
    if (!edited.ok) {
      return redirect(
        `/ask-leilia/admin/reviews/?status=${existing.moderation_status}&error=${encodeURIComponent(edited.error)}`,
        303,
      );
    }

    const verificationRaw = form.get("verificationStatus");
    const verificationStatus = isAskLeiliaReviewVerificationStatus(verificationRaw)
      ? verificationRaw
      : existing.verification_status;

    const result = await updateAskLeiliaReviewModeration(service, {
      id: reviewId,
      moderationStatus: existing.moderation_status,
      approvedBy: existing.approved_by,
      displayName: edited.value.displayName,
      bodyPublic: edited.value.bodyPublic,
      title: edited.value.title || null,
      verificationStatus,
      isFeatured: existing.is_featured,
    });

    if (!result.ok) {
      return redirect(
        `/ask-leilia/admin/reviews/?status=${existing.moderation_status}&error=${encodeURIComponent(result.error)}`,
        303,
      );
    }

    return redirect(
      `/ask-leilia/admin/reviews/?status=${existing.moderation_status}&saved=1`,
      303,
    );
  }

  if (action === "approve" || action === "archive" || action === "restore") {
    const nextStatus =
      action === "approve" ? "approved" : action === "archive" ? "archived" : "pending";

    if (!isAskLeiliaReviewModerationStatus(nextStatus)) {
      return redirect("/ask-leilia/admin/reviews/?error=Invalid+status", 303);
    }

    const edited = validateAskLeiliaReviewAdminEdit({
      displayName: form.get("displayName") ?? existing.display_name,
      bodyPublic: form.get("bodyPublic") ?? existing.body_public ?? existing.body_original,
      title: form.get("title") ?? existing.title ?? "",
    });

    if (!edited.ok) {
      return redirect(
        `/ask-leilia/admin/reviews/?status=${existing.moderation_status}&error=${encodeURIComponent(edited.error)}`,
        303,
      );
    }

    const verificationRaw = form.get("verificationStatus");
    const verificationStatus = isAskLeiliaReviewVerificationStatus(verificationRaw)
      ? verificationRaw
      : existing.verification_status;

    const result = await updateAskLeiliaReviewModeration(service, {
      id: reviewId,
      moderationStatus: nextStatus,
      approvedBy: locals.user?.id ?? null,
      displayName: edited.value.displayName,
      bodyPublic: edited.value.bodyPublic,
      title: edited.value.title || null,
      verificationStatus,
      isFeatured: nextStatus === "approved" ? existing.is_featured : false,
    });

    if (!result.ok) {
      return redirect(
        `/ask-leilia/admin/reviews/?status=${existing.moderation_status}&error=${encodeURIComponent(result.error)}`,
        303,
      );
    }

    return redirect(`/ask-leilia/admin/reviews/?status=${nextStatus}&saved=1`, 303);
  }

  return redirect("/ask-leilia/admin/reviews/?error=Unknown+action", 303);
};
