/**
 * Rider–Waite–Smith card image paths (same convention as the two-card tool).
 * Assets live under `public/images/tarot/rws/`.
 */
export function tarotCardImagePath(cardId: string): string {
  const fileId = cardId === "wheel-of-fortune" ? "the-wheel-of-fortune" : cardId;
  return `/images/tarot/rws/${fileId}.jpg`;
}
