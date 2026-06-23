import type { APIRoute } from "astro";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { notifyAskLeiliaRequestSubmitted } from "../../../lib/ask-leilia/notifications";
import { validateAskLeiliaRequest } from "../../../lib/ask-leilia/validation";

export const prerender = false;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
  const { data: payment, error: paymentError } = await service
    .from("ask_leilia_payments")
    .select("id, payment_status")
    .eq("customer_email", validation.value.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    console.error("Ask Leilia payment lookup failed:", paymentError);
    return json({ ok: false, error: "Unable to confirm payment right now." }, 500);
  }

  if (!payment || payment.payment_status !== "paid") {
    return json(
      {
        ok: false,
        error:
          "We could not find a completed payment for this email address. Please use the same email you used at payment.",
      },
      400,
    );
  }

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
      console.error("Ask Leilia image upload failed:", uploadError);
      return json({ ok: false, error: "Unable to upload the card image right now." }, 500);
    }
  }

  const { error } = await service.from("ask_leilia_requests").insert({
    payment_id: (payment as { id: string }).id,
    name: validation.value.name,
    email: validation.value.email,
    question: validation.value.question,
    context: validation.value.context || null,
    card_preference: validation.value.cardPreference,
    image_url: imageUrl,
    status: "Paid",
    admin_notes: null,
  });

  if (error) {
    console.error("Ask Leilia request insert failed:", error);
    return json({ ok: false, error: "Unable to save your request right now." }, 500);
  }

  await notifyAskLeiliaRequestSubmitted(
    {
      name: validation.value.name,
      email: validation.value.email,
      question: validation.value.question,
    },
    locals,
  );

  return redirect("/ask-leilia/request/?submitted=true", 303);
};
