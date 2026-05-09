globalThis.process ??= {}; globalThis.process.env ??= {};
const LIBRARY_PER_PAGE = 12;
const LIBRARY_FEATURED_COUNT = 4;
function totalPages(count, perPage) {
  return Math.max(1, Math.ceil(count / perPage));
}
function slicePage(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

function libraryListPath(mode, page) {
  const p = Math.max(1, page);
  switch (mode.kind) {
    case "newest":
      return p === 1 ? "/articles/" : `/articles/page/${p}/`;
    case "oldest":
      return p === 1 ? "/articles/sort/oldest/" : `/articles/sort/oldest/page/${p}/`;
    case "series":
      return p === 1 ? "/articles/sort/series/" : `/articles/sort/series/page/${p}/`;
    case "filter":
      return p === 1 ? `/articles/filter/${mode.seriesSlug}/` : `/articles/filter/${mode.seriesSlug}/page/${p}/`;
  }
}
function libraryPaginationState(mode, currentPage, totalPages, base) {
  const pages = Array.from({ length: totalPages }, (_, i) => {
    const num = i + 1;
    const path = libraryListPath(mode, num);
    return {
      num,
      href: path,
      current: num === currentPage
    };
  });
  const prevPath = currentPage > 1 ? libraryListPath(mode, currentPage - 1) : null;
  const nextPath = currentPage < totalPages ? libraryListPath(mode, currentPage + 1) : null;
  return {
    pages,
    prevHref: prevPath,
    nextHref: nextPath,
    relPrevAbsolute: prevPath ? new URL(prevPath, base).href : null,
    relNextAbsolute: nextPath ? new URL(nextPath, base).href : null
  };
}

export { LIBRARY_PER_PAGE as L, LIBRARY_FEATURED_COUNT as a, libraryListPath as b, libraryPaginationState as l, slicePage as s, totalPages as t };
