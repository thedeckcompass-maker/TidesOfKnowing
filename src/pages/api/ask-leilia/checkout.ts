import type { APIRoute } from "astro";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import {
  buildPaymentLinkRedirectUrl,
  paymentLinkForReadingType,
} from "../../../lib/ask-leilia/paymentLinks";
import { logAskLeiliaPipeline } from "../../../lib/ask-leilia/pipelineLog";
import { isAskLeiliaReadingType } from "../../../lib/ask-leilia/readingTypes";
import { insertAskLeiliaPendingRequest, uploadAskLeiliaCardImage } from "../../../lib/ask-leilia/submitRequest";
import type { AskLeiliaCardPreference } from "../../../lib/ask-leilia/types";
import {
  validateAskLeiliaRequest,
  validateInDepthRequest,
  validatePersonalGuidanceRequest,
} from "../../../lib/ask-leilia/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData();
  const readingTypeRaw = form.get("readingType");
  const readingType = isAskLeiliaReadingType(readingTypeRaw) ? readingTypeRaw : "one-question";

  logAskLeiliaPipeline("CHECKOUT_START", { readingType });

  const service = createCommunityServiceClient(locals);
  let imageUrl: string | null = null;

  if (readingType === "one-question") {
    const image = form.get("cardImage");
    if (image instanceof File && image.size > 0) {
      const upload = await uploadAskLeiliaCardImage(service, image);
      if ("error" in upload) {
        return json({ ok: false, error: upload.error }, 400);
      }
      imageUrl = upload.imageUrl;
    }
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
    cardPreference = "pull_for_me";
  } else {
    const validation = validatePersonalGuidanceRequest({
      name: form.get("name"),
      email: form.get("email"),
      questions: form.get("questions"),
      circumstances: form.get("circumstances"),
      lookingAhead: form.get("lookingAhead"),
      important: form.get("important"),
      lifeAreas: form.getAll("lifeAreas"),
      lifeAreaOther: form.get("lifeAreaOther"),
    });

    if (!validation.ok) {
      return json({ ok: false, error: validation.error }, 400);
    }

    name = validation.value.name;
    email = validation.value.email;
    question = validation.value.question;
    context = validation.value.context;
    cardPreference = "pull_for_me";
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
    logAskLeiliaPipeline("REQUEST_INSERT_FAILURE", {
      customerEmail: email,
      readingType,
      error: inserted.error,
    });
    return json({ ok: false, error: inserted.error }, 500);
  }

  logAskLeiliaPipeline("REQUEST_INSERT_SUCCESS", {
    requestId: inserted.id,
    customerEmail: email,
    readingType,
    requestStatus: "Pending Payment",
  });

  const paymentUrl = buildPaymentLinkRedirectUrl(
    paymentLinkForReadingType(readingType),
    inserted.id,
    email,
  );

  logAskLeiliaPipeline("REDIRECT_TO_STRIPE", {
    requestId: inserted.id,
    customerEmail: email,
    readingType,
    requestStatus: "Pending Payment",
  });

  return Response.redirect(paymentUrl, 303);
};
