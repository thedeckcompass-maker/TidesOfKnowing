import type { RecentClientReadingEntry } from "./recentClientReadings";

/** Public web root for optimised spread photographs. */
export const CLIENT_READING_SPREAD_IMAGE_PUBLIC_DIR = "/images/client-readings";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function normalizeSpreadImageKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isSpreadImageFilename(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export type ParsedSpreadImageFilename = {
  prefix: string;
  index: number;
  extension: string;
};

/** Parse canonical `{slug}-{n}.ext` or legacy `{slug}_{n}.ext`. */
export function parseSpreadImageFilename(filename: string): ParsedSpreadImageFilename {
  const dot = filename.lastIndexOf(".");
  const extension = dot >= 0 ? filename.slice(dot).toLowerCase() : "";
  const stem = dot >= 0 ? filename.slice(0, dot) : filename;
  const seqMatch = stem.match(/^(.+)[-_](\d+)$/);
  if (!seqMatch) {
    throw new Error(`Spread image filename must use {slug}-{n}.ext: ${filename}`);
  }
  return {
    prefix: seqMatch[1],
    index: Number(seqMatch[2]),
    extension,
  };
}

/** Match image prefix to a reading slug (canonical filenames only). */
export function resolveSpreadImagePrefixToSlug(
  prefix: string,
  knownSlugs: Set<string>,
): string | null {
  const key = normalizeSpreadImageKey(prefix);
  if (knownSlugs.has(key)) return key;
  return null;
}

export function publicSpreadImagePath(slug: string, index: number): string {
  return `${CLIENT_READING_SPREAD_IMAGE_PUBLIC_DIR}/${slug}/${slug}-${index}.jpg`;
}

export function getFeaturedSpreadImage(
  entry: RecentClientReadingEntry,
): string | undefined {
  return entry.data.spreadImages[0];
}

export function getGallerySpreadImages(entry: RecentClientReadingEntry): string[] {
  return entry.data.spreadImages.slice(1);
}
