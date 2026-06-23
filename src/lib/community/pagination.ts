import type { CommunitySectionKey } from "./types";

export const COMMUNITY_POSTS_PER_PAGE = 12;

export type CommunityListMode =
  | { kind: "all" }
  | { kind: "section"; sectionKey: CommunitySectionKey }
  | { kind: "search"; query: string };

export function totalCommunityPages(count: number): number {
  return Math.max(1, Math.ceil(count / COMMUNITY_POSTS_PER_PAGE));
}

export function communityListPath(mode: CommunityListMode, page: number): string {
  const p = Math.max(1, page);

  if (mode.kind === "section") {
    const base = `/community/sections/${mode.sectionKey}/`;
    return p === 1 ? base : `${base}page/${p}/`;
  }

  if (mode.kind === "search") {
    const params = new URLSearchParams({ q: mode.query });
    if (p > 1) params.set("page", String(p));
    return `/community/search/?${params.toString()}`;
  }

  return p === 1 ? "/community/" : `/community/page/${p}/`;
}

export function communityPaginationState(
  mode: CommunityListMode,
  currentPage: number,
  totalPages: number,
  base: URL,
) {
  const pages = Array.from({ length: totalPages }, (_, index) => {
    const num = index + 1;
    return {
      num,
      href: communityListPath(mode, num),
      current: num === currentPage,
    };
  });

  const prevPath =
    currentPage > 1 ? communityListPath(mode, currentPage - 1) : null;
  const nextPath =
    currentPage < totalPages ? communityListPath(mode, currentPage + 1) : null;

  return {
    pages,
    prevHref: prevPath,
    nextHref: nextPath,
    relPrevAbsolute: prevPath ? new URL(prevPath, base).href : null,
    relNextAbsolute: nextPath ? new URL(nextPath, base).href : null,
  };
}
