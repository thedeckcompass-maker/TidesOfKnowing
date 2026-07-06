import type { SupabaseClient } from "@supabase/supabase-js";
import type { AskLeiliaCardPreference } from "./types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function extensionForType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadAskLeiliaCardImage(
  service: SupabaseClient,
  image: File,
): Promise<{ imageUrl: string } | { error: string }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
    return { error: "Please upload a JPG, PNG, or WebP image." };
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return { error: "Please keep image uploads under 8 MB." };
  }

  const ext = extensionForType(image.type);
  const imageUrl = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await service.storage
    .from("ask-leilia-uploads")
    .upload(imageUrl, image, {
      contentType: image.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Ask Leilia image upload failed:", uploadError);
    return { error: "Unable to upload the card image right now." };
  }

  return { imageUrl };
}

export async function insertAskLeiliaPendingRequest(
  service: SupabaseClient,
  input: {
    name: string;
    email: string;
    question: string;
    context: string | null;
    cardPreference: AskLeiliaCardPreference;
    imageUrl: string | null;
    readingTypeLabel?: string | null;
  },
): Promise<{ id: string } | { error: string }> {
  const { data: insertedRequest, error: insertError } = await service
    .from("ask_leilia_requests")
    .insert({
      payment_id: null,
      name: input.name,
      email: input.email,
      question: input.question,
      context: input.context,
      card_preference: input.cardPreference,
      image_url: input.imageUrl,
      status: "Pending Payment",
      admin_notes: input.readingTypeLabel ? `Reading type: ${input.readingTypeLabel}` : null,
    })
    .select("id")
    .single();

  if (insertError || !insertedRequest) {
    console.error("Ask Leilia pending request insert failed:", insertError);
    return { error: "Unable to save your request right now." };
  }

  return { id: (insertedRequest as { id: string }).id };
}
