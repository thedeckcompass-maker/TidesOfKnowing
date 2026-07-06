import type { APIRoute } from "astro";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import {
  buildPaymentLinkRedirectUrl,
  paymentLinkForReadingType,
} from "../../../lib/ask-leilia/paymentLinks";
import { isAskLeiliaReadingType } from "../../../lib/ask-leilia/readingTypes";
import { insertAskLeiliaPendingRequest, uploadAskLeiliaCardImage } from "../../../lib/ask-leilia/submitRequest";
import type { AskLeiliaCardPreference } from "../../../lib/ask-leilia/types";
import {
  validateAskLeiliaRequest,
  validateInDepthRequest,
  validatePersonalGuidanceRequest,
} from "../../../lib/ask-leilia/validation";

export const prerender = false;

function cardPreferenceFromForm(
  form: FormData,
  imageUrl: string | null,
): AskLeiliaCardPreference | null {
  const value = form.get("cardPreference");
  if (value === "pull_for_me" || value === "own_cards_attached") {
    return value;
  }

  if (imageUrl) {
    return "own_cards_attached";
  }

  return "pull_for_me";
}

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData();
  const readingTypeRaw = form.get("readingType");
  const readingType = isAskLeiliaReadingType(readingTypeRaw) ? readingTypeRaw : "one-question";

  const service = createCommunityServiceClient(locals);
  const image = form.get("cardImage");
  let imageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    const upload = await uploadAskLeiliaCardImage(service, image);
    if ("error" in upload) {
      return json({ ok: false, error: upload.error }, 400);
    }
    imageUrl = upload.imageUrl;
  }

  let name = "";
  let email = "";
  let question = "";
  let context: string | null = null;
  let cardPreference: AskLeiliaCardPreference | null = null;

  if (readingType === "one-question") {
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

    name = validation.value.name;
    email = validation.value.email;
    question = validation.value.question;
    context = validation.value.context || null;
    cardPreference = validation.value.cardPreference;
  } else if (readingType === "in-depth") {
    const validation = validateInDepthRequest({
      name: form.get("name"),
      email: form.get("email"),
      primaryQuestion: form.get("primaryQuestion"),
      background: form.get("background"),
      outcome: form.get("outcome"),
      beforeBegin: form.get("beforeBegin"),
    });

    if (!validation.ok) {
      return json({ ok: false, error: validation.error }, 400);
    }

    name = validation.value.name;
    email = validation.value.email;
    question = validation.value.question;
    context = validation.value.context;
    cardPreference = cardPreferenceFromForm(form, imageUrl);
  } else {
    const validation = validatePersonalGuidanceRequest({
      name: form.get("name"),
      email: form.get("email"),
      questions: form.get("questions"),
      circumstances: form.get("circumstances"),
      lookingAhead: form.get("lookingAhead"),
      important: form.get("important"),
      lifeAreas: form.getAll("lifeAreas"),
    });

    if (!validation.ok) {
      return json({ ok: false, error: validation.error }, 400);
    }

    name = validation.value.name;
    email = validation.value.email;
    question = validation.value.question;
    context = validation.value.context;
    cardPreference = cardPreferenceFromForm(form, imageUrl);
  }

  if (!cardPreference) {
    return json({ ok: false, error: "Please choose a card preference." }, 400);
  }

  const inserted = await insertAskLeiliaPendingRequest(service, {
    name,
    email,
    question,
    context,
    cardPreference,
    imageUrl,
    readingType,
  });

  if ("error" in inserted) {
    return json({ ok: false, error: inserted.error }, 500);
  }

  const paymentUrl = buildPaymentLinkRedirectUrl(
    paymentLinkForReadingType(readingType),
    inserted.id,
    email,
  );

  return Response.redirect(paymentUrl, 303);
};
