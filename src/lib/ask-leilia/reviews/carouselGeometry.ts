/**
 * Ask Leilia reviews carousel geometry — single source of truth for
 * visible-card count, card width, and page translation.
 *
 * Layout is derived from the carousel viewport's measured width (not
 * window.innerWidth and not divergent CSS breakpoints), so foldables and
 * intermediate tablet widths resolve to complete cards only.
 */

/** Minimum readable card width in CSS pixels. */
export const ASK_REVIEWS_MIN_CARD_WIDTH = 320;

/** Hard cap matching the approved desktop layout. */
export const ASK_REVIEWS_MAX_PER_PAGE = 3;

/** Card width for N complete cards including inter-card gaps. */
export function askReviewsCardWidth(
  viewportWidth: number,
  perPage: number,
  gap: number,
): number {
  if (!(viewportWidth > 0) || perPage < 1) return 0;
  const totalGaps = Math.max(0, perPage - 1) * Math.max(0, gap);
  return Math.max(0, (viewportWidth - totalGaps) / perPage);
}

/**
 * Largest N in [1, 3] where N complete cards plus (N-1) gaps fit the
 * viewport without shrinking below the minimum card width.
 */
export function askReviewsPerPage(
  viewportWidth: number,
  gap: number,
  minCardWidth: number = ASK_REVIEWS_MIN_CARD_WIDTH,
): number {
  if (!(viewportWidth > 0)) return 1;
  const safeGap = Math.max(0, gap);
  const safeMin = Math.max(1, minCardWidth);
  for (let n = ASK_REVIEWS_MAX_PER_PAGE; n >= 1; n -= 1) {
    if (askReviewsCardWidth(viewportWidth, n, safeGap) >= safeMin - 0.01) {
      return n;
    }
  }
  return 1;
}

export function askReviewsPageCount(cardCount: number, perPage: number): number {
  if (cardCount < 1 || perPage < 1) return 0;
  return Math.ceil(cardCount / perPage);
}

/**
 * Distance from the start of one page to the start of the next.
 * Flex gap exists between every card — including across page boundaries —
 * so the stride is viewportWidth + gap, not viewportWidth alone.
 */
export function askReviewsPageStride(viewportWidth: number, gap: number): number {
  if (!(viewportWidth > 0)) return 0;
  return viewportWidth + Math.max(0, gap);
}

export function askReviewsPageOffset(
  page: number,
  viewportWidth: number,
  gap: number,
): number {
  if (page <= 0) return 0;
  return page * askReviewsPageStride(viewportWidth, gap);
}

export function askReviewsWrapPage(
  page: number,
  delta: number,
  pageCount: number,
): number {
  if (pageCount < 1) return 0;
  return (((page + delta) % pageCount) + pageCount) % pageCount;
}

export function askReviewsClampPage(page: number, pageCount: number): number {
  if (pageCount < 1) return 0;
  return Math.min(Math.max(0, page), pageCount - 1);
}
