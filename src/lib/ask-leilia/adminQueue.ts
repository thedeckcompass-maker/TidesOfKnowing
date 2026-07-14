import type { AskLeiliaRequest } from "./types";

export const ASK_LEILIA_ADMIN_SORTS = ["newest", "oldest"] as const;
export type AskLeiliaAdminSort = (typeof ASK_LEILIA_ADMIN_SORTS)[number];

export const ASK_LEILIA_ARCHIVE_FILTERS = ["active", "archived", "all"] as const;
export type AskLeiliaArchiveFilter = (typeof ASK_LEILIA_ARCHIVE_FILTERS)[number];

export function parseAskLeiliaAdminSort(value: unknown): AskLeiliaAdminSort {
  return value === "oldest" ? "oldest" : "newest";
}

export function parseAskLeiliaArchiveFilter(value: unknown): AskLeiliaArchiveFilter {
  if (value === "archived" || value === "all") return value;
  return "active";
}

export function isAskLeiliaRequestArchived(
  request: Pick<AskLeiliaRequest, "archived_at">,
): boolean {
  return Boolean(request.archived_at);
}

/** Stable secondary sort by id when created_at values collide. */
export function compareAskLeiliaAdminRequests(
  a: Pick<AskLeiliaRequest, "id" | "created_at">,
  b: Pick<AskLeiliaRequest, "id" | "created_at">,
  sort: AskLeiliaAdminSort,
): number {
  const aTime = Date.parse(a.created_at);
  const bTime = Date.parse(b.created_at);
  const aValid = Number.isFinite(aTime);
  const bValid = Number.isFinite(bTime);

  if (aValid && bValid && aTime !== bTime) {
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  }
  if (aValid !== bValid) {
    // Valid timestamps sort ahead of invalid ones for newest; behind for oldest.
    if (sort === "oldest") return aValid ? -1 : 1;
    return aValid ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortAskLeiliaAdminRequests<T extends Pick<AskLeiliaRequest, "id" | "created_at">>(
  requests: T[],
  sort: AskLeiliaAdminSort,
): T[] {
  return [...requests].sort((a, b) => compareAskLeiliaAdminRequests(a, b, sort));
}

export function filterAskLeiliaAdminRequestsByArchive<
  T extends Pick<AskLeiliaRequest, "archived_at">,
>(requests: T[], archiveFilter: AskLeiliaArchiveFilter): T[] {
  if (archiveFilter === "all") return requests;
  if (archiveFilter === "archived") {
    return requests.filter((request) => Boolean(request.archived_at));
  }
  return requests.filter((request) => !request.archived_at);
}

export function paymentStatusLabel(
  request: Pick<AskLeiliaRequest, "status" | "payment">,
): string {
  if (request.payment?.payment_status) {
    const raw = request.payment.payment_status.trim();
    if (!raw) return "Unknown";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (request.status === "Pending Payment") return "Awaiting payment";
  if (request.status === "Payment Exception") return "Exception";
  return "Not linked";
}

export type LocalSubmissionDisplay = {
  dateText: string;
  timeText: string;
  title: string;
  unavailable: boolean;
};

/** Server-side fallback formatter (UTC). Client JS replaces with local timezone. */
export function formatSubmissionDisplayUtc(iso: string | null | undefined): LocalSubmissionDisplay {
  if (!iso || !String(iso).trim()) {
    return {
      dateText: "Submission time unavailable",
      timeText: "",
      title: "Submission time unavailable",
      unavailable: true,
    };
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return {
      dateText: "Submission time unavailable",
      timeText: "",
      title: "Submission time unavailable",
      unavailable: true,
    };
  }

  const dateText = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  const timeText = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);

  return {
    dateText,
    timeText: `${timeText} UTC`,
    title: `${dateText} ${timeText} UTC`,
    unavailable: false,
  };
}

export function adminQueueReturnPath(input: {
  readingType: string;
  sort: AskLeiliaAdminSort;
  archive: AskLeiliaArchiveFilter;
}): string {
  const params = new URLSearchParams();
  if (input.readingType !== "all") params.set("reading_type", input.readingType);
  if (input.sort !== "newest") params.set("sort", input.sort);
  if (input.archive !== "active") params.set("archive", input.archive);
  const query = params.toString();
  return query ? `/ask-leilia/admin/?${query}` : "/ask-leilia/admin/";
}

export function parseAdminReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/ask-leilia/admin/")) {
    return "/ask-leilia/admin/";
  }
  try {
    const url = new URL(value, "https://www.tidesofknowing.com");
    if (url.pathname !== "/ask-leilia/admin" && url.pathname !== "/ask-leilia/admin/") {
      return "/ask-leilia/admin/";
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return "/ask-leilia/admin/";
  }
}
