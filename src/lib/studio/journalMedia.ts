import type { SupabaseClient } from "@supabase/supabase-js";

export const STUDIO_JOURNAL_PHOTO_BUCKET = "studio-journal-photos";
export const STUDIO_JOURNAL_PHOTO_LIMIT = 5;
export const STUDIO_JOURNAL_PHOTO_MAX_BYTES = 6 * 1024 * 1024;

export async function validateSanitisedJournalPhoto(value: unknown): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  if (!(value instanceof File) || value.size < 1) return { ok: false, error: "Choose at least one photograph." };
  if (value.type !== "image/jpeg") return { ok: false, error: "Photographs must be prepared as metadata-free JPEG files." };
  if (value.size > STUDIO_JOURNAL_PHOTO_MAX_BYTES) return { ok: false, error: "Keep each prepared photograph under 6 MB." };
  const bytes = new Uint8Array(await value.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
    return { ok: false, error: "The prepared photograph is not a valid JPEG file." };
  }
  const header = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 262144)));
  if (/Exif\x00\x00|GPSLatitude|GPSLongitude|<x:xmpmeta|http:\/\/ns\.adobe\.com\/xap/i.test(header)) {
    return { ok: false, error: "Location or descriptive metadata remains in this photograph. Prepare it again before upload." };
  }
  return { ok: true, file: value };
}

export async function removeStudioJournalPhotoObject(supabase: SupabaseClient, path: string) {
  return supabase.storage.from(STUDIO_JOURNAL_PHOTO_BUCKET).remove([path]);
}
