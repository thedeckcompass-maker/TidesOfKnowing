/** Collapse whitespace and lowercase for loose text comparison. */
export function normalizeComparableText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** True when two strings are the same after normalization. */
export function textsAreEquivalent(a: string, b: string): boolean {
  return normalizeComparableText(a) === normalizeComparableText(b);
}

/**
 * True when `candidate` is already fully represented in `container`
 * (exact match or normalized substring). Used to avoid duplicate UI blocks.
 */
export function textIsContainedIn(candidate: string, container: string): boolean {
  const normCandidate = normalizeComparableText(candidate);
  const normContainer = normalizeComparableText(container);
  if (!normCandidate) return true;
  if (normCandidate === normContainer) return true;
  return normContainer.includes(normCandidate);
}
