import type { SupabaseClient } from "@supabase/supabase-js";

const SPREAD_IMAGE_BUCKET = "community-spread-images";
const MAX_SPREAD_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_SPREAD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SpreadImageUploadResult =
  | { ok: true; path: string | null }
  | { ok: false; error: string; status: number };

function extensionForType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadReadingPracticeSpreadImage(
  service: SupabaseClient,
  input: {
    image: unknown;
    authorId: string;
    sectionKey: string;
  },
): Promise<SpreadImageUploadResult> {
  if (!(input.image instanceof File) || input.image.size === 0) {
    return { ok: true, path: null };
  }

  if (input.sectionKey !== "reading-practice") {
    return {
      ok: false,
      error: "Spread images are only available for Reading Practice posts.",
      status: 400,
    };
  }

  if (!SUPPORTED_SPREAD_IMAGE_TYPES.includes(input.image.type as (typeof SUPPORTED_SPREAD_IMAGE_TYPES)[number])) {
    return { ok: false, error: "Please upload a JPG, PNG, or WebP image.", status: 400 };
  }

  if (input.image.size > MAX_SPREAD_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Please keep spread images under 10 MB.",
      status: 400,
    };
  }

  const ext = extensionForType(input.image.type);
  const path = `${input.authorId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await service.storage.from(SPREAD_IMAGE_BUCKET).upload(path, input.image, {
    contentType: input.image.type,
    upsert: false,
  });

  if (error) {
    console.error("Unable to upload Reading Practice spread image:", error);
    return { ok: false, error: "Unable to upload the spread image right now.", status: 500 };
  }

  return { ok: true, path };
}

export function getSpreadImagePublicUrl(service: SupabaseClient, path: string | null): string | null {
  if (!path) return null;
  const { data } = service.storage.from(SPREAD_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl || null;
}
