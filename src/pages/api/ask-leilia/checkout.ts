import type { APIRoute } from "astro";
import Stripe from "stripe";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { validateAskLeiliaRequest } from "../../../lib/ask-leilia/validation";

export const prerender = false;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function runtimeValue(name: string, locals?: unknown): string {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string | undefined> } } | undefined)
    ?.runtime?.env;
  return runtimeEnv?.[name] ?? (import.meta.env[name] as string | undefined) ?? "";
}

function extensionForType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export const POST: APIRoute = async ({ request, locals }) => {
  const stripeSecretKey = runtimeValue("STRIPE_SECRET_KEY", locals);
  if (!stripeSecretKey) {
    return json({ ok: false, error: "Stripe checkout is not configured." }, 500);
  }

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
      console.error("Ask Leilia image upload failed:", uploadError);
      return json({ ok: false, error: "Unable to upload the card image right now." }, 500);
    }
  }

  const { data: insertedRequest, error: insertError } = await service
    .from("ask_leilia_requests")
    .insert({
      payment_id: null,
      name: validation.value.name,
      email: validation.value.email,
      question: validation.value.question,
      context: validation.value.context || null,
      card_preference: validation.value.cardPreference,
      image_url: imageUrl,
      status: "Pending Payment",
      admin_notes: null,
    })
    .select("id")
    .single();

  if (insertError || !insertedRequest) {
    console.error("Ask Leilia pending request insert failed:", insertError);
    return json({ ok: false, error: "Unable to save your request right now." }, 500);
  }

  const requestId = (insertedRequest as { id: string }).id;
  const origin = new URL(request.url).origin;
  const stripe = new Stripe(stripeSecretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: validation.value.email,
      client_reference_id: requestId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 2500,
            product_data: {
              name: "Ask Leilia - One Question, Three Cards",
            },
          },
        },
      ],
      metadata: {
        ask_leilia_request_id: requestId,
        customer_email: validation.value.email,
        source: "ask_leilia",
      },
      success_url: `${origin}/ask-leilia/thank-you/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/ask-leilia/request/?payment=cancelled`,
    });

    if (!session.url) {
      console.error("Ask Leilia checkout session created without URL", { requestId });
      return json({ ok: false, error: "Unable to start checkout right now." }, 500);
    }

    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error("Ask Leilia checkout session creation failed:", error);
    return json({ ok: false, error: "Unable to start checkout right now." }, 500);
  }
};
