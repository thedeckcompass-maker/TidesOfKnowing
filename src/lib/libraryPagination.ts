export const LIBRARY_PER_PAGE = 12;
export const LIBRARY_FEATURED_COUNT = 4;

export function totalPages(count: number, perPage: number): number {
  return Math.max(1, Math.ceil(count / perPage));
}

export function slicePage<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
