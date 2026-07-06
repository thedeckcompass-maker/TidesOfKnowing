/** Maximum length for profile display names (after normalisation). */
export const DISPLAY_NAME_MAX_LENGTH = 60;

/**
 * Reserved display names (case-insensitive). Extend this list as needed.
 * Stored lowercase for comparison; labels are for documentation only.
 */
export const RESERVED_DISPLAY_NAMES: readonly string[] = [
  "admin",
  "administrator",
  "moderator",
  "support",
  "system",
  "leilia",
  "tides of knowing",
];

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isReservedDisplayName(displayName: string): boolean {
  const normalized = normalizeDisplayName(displayName).toLowerCase();
  return RESERVED_DISPLAY_NAMES.includes(normalized);
}

export function displayNamesMatch(a: string, b: string): boolean {
  return normalizeDisplayName(a).toLowerCase() === normalizeDisplayName(b).toLowerCase();
}
