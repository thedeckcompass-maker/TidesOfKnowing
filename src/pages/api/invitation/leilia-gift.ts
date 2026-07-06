import type { APIRoute } from "astro";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { notifyAskLeiliaComplimentaryRequest } from "../../../lib/ask-leilia/notifications";
import { validateAskLeiliaRequest } from "../../../lib/ask-leilia/validation";

export const prerender = false;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const COMPLIMENTARY_ADMIN_NOTE = "Complimentary invitation (Leilia Gift)";

function extensionForType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const validation = validateAskLeiliaRequest({
    name: form.get("name"),
    email: form.get("email"),
    question: form.get("question"),
    context: form.get("context"),
    cardPreference: form.get("cardPreference"),
  });

  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const image = form.get("cardImage");
  let imageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return json({ ok: false, error: "Please upload a JPG, PNG, or WebP image." }, 400);
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: "Please keep image uploads under 8 MB." }, 400);
    }

    const ext = extensionForType(image.type);
    imageUrl = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await service.storage
      .from("ask-leilia-uploads")
      .upload(imageUrl, image, {
        contentType: image.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Leilia Gift image upload failed:", uploadError);
      return json({ ok: false, error: "Unable to upload the card image right now." }, 500);
    }
  }

  const { error } = await service.from("ask_leilia_requests").insert({
    payment_id: null,
    name: validation.value.name,
    email: validation.value.email,
    question: validation.value.question,
    context: validation.value.context || null,
    card_preference: validation.value.cardPreference,
    image_url: imageUrl,
    status: "Paid",
    admin_notes: COMPLIMENTARY_ADMIN_NOTE,
  });

  if (error) {
    console.error("Leilia Gift request insert failed:", error);
    return json({ ok: false, error: "Unable to save your request right now." }, 500);
  }

  await notifyAskLeiliaComplimentaryRequest(
    {
      name: validation.value.name,
      email: validation.value.email,
      question: validation.value.question,
      context: validation.value.context,
      cardPreference: validation.value.cardPreference,
      imageUrl,
    },
    locals,
  );

  return redirect("/invitation/leilia-gift/?submitted=true", 303);
};
