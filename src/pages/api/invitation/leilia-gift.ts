import type { APIRoute } from "astro";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { notifyAskLeiliaComplimentaryRequest } from "../../../lib/ask-leilia/notifications";
import {
  insertAskLeiliaComplimentaryRequest,
  uploadAskLeiliaCardImage,
} from "../../../lib/ask-leilia/submitRequest";
import { validateAskLeiliaRequest } from "../../../lib/ask-leilia/validation";

export const prerender = false;

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
    const upload = await uploadAskLeiliaCardImage(service, image);
    if ("error" in upload) {
      return json({ ok: false, error: upload.error }, 400);
    }
    imageUrl = upload.imageUrl;
  }

  const inserted = await insertAskLeiliaComplimentaryRequest(service, {
    name: validation.value.name,
    email: validation.value.email,
    question: validation.value.question,
    context: validation.value.context || null,
    cardPreference: validation.value.cardPreference,
    imageUrl,
  });

  if ("error" in inserted) {
    return json({ ok: false, error: inserted.error }, 500);
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
