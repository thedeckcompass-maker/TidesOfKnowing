export type LibraryListMode =
  | { kind: "newest" }
  | { kind: "oldest" }
  | { kind: "series" }
  | { kind: "filter"; seriesSlug: string };

export function libraryListPath(mode: LibraryListMode, page: number): string {
  const p = Math.max(1, page);
  switch (mode.kind) {
    case "newest":
      return p === 1 ? "/articles/" : `/articles/page/${p}/`;
    case "oldest":
      return p === 1
        ? "/articles/sort/oldest/"
        : `/articles/sort/oldest/page/${p}/`;
    case "series":
      return p === 1
        ? "/articles/sort/series/"
        : `/articles/sort/series/page/${p}/`;
    case "filter":
      return p === 1
        ? `/articles/filter/${mode.seriesSlug}/`
        : `/articles/filter/${mode.seriesSlug}/page/${p}/`;
  }
}

export function libraryPaginationState(
  mode: LibraryListMode,
  currentPage: number,
  totalPages: number,
  base: URL,
): {
  pages: { num: number; href: string; current: boolean }[];
  prevHref: string | null;
  nextHref: string | null;
  relPrevAbsolute: string | null;
  relNextAbsolute: string | null;
} {
  const pages = Array.from({ length: totalPages }, (_, i) => {
    const num = i + 1;
    const path = libraryListPath(mode, num);
    return {
      num,
      href: path,
      current: num === currentPage,
    };
  });

  const prevPath =
    currentPage > 1 ? libraryListPath(mode, currentPage - 1) : null;
  const nextPath =
    currentPage < totalPages
      ? libraryListPath(mode, currentPage + 1)
      : null;

  return {
    pages,
    prevHref: prevPath,
    nextHref: nextPath,
    relPrevAbsolute: prevPath ? new URL(prevPath, base).href : null,
    relNextAbsolute: nextPath ? new URL(nextPath, base).href : null,
  };
}
