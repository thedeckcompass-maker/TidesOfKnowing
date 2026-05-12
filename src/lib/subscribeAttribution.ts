/** Newsletter landing path only; attribution helpers are for MailerLite /subscribe/ links. */

export type SubscribeAttributionInput = {
  pagePathname: string;
  /** Shown as `source_component` and default `utm_content` (override with `utmContent`). */
  sourceComponent: string;
  /** When set, used for `utm_content` instead of `sourceComponent`. */
  utmContent?: string;
};

function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max);
}

function normalizePath(pathname: string): string {
  const p = pathname.trim() || "/";
  return p.startsWith("/") ? p : `/${p}`;
}

/**
 * Returns true if `href` targets the site newsletter page (/subscribe/).
 */
export function isSubscribeHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed);
      const norm = u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname;
      return norm === "/subscribe";
    }
    const q = trimmed.indexOf("?");
    const pathPart = q >= 0 ? trimmed.slice(0, q) : trimmed;
    const norm = pathPart.endsWith("/") ? pathPart.slice(0, -1) : pathPart;
    return norm === "/subscribe";
  } catch {
    return false;
  }
}

/**
 * Merges UTM + source query params onto a /subscribe/ URL. Overwrites standard attribution keys.
 * Does not add `source_url` or arbitrary full URLs (path only).
 */
export function withSubscribeSourceAttribution(
  href: string,
  input: SubscribeAttributionInput,
): string {
  if (!isSubscribeHref(href)) return href;

  let search = "";
  try {
    if (/^https?:\/\//i.test(href.trim())) {
      const u = new URL(href.trim());
      search = u.search.slice(1);
    } else {
      const q = href.indexOf("?");
      search = q >= 0 ? href.slice(q + 1) : "";
    }
  } catch {
    return href;
  }

  const params = new URLSearchParams(search);
  params.set("source_path", normalizePath(input.pagePathname));
  const placement = clip(input.sourceComponent, 200);
  params.set("source_component", placement);
  params.set("utm_source", "tidesofknowing");
  params.set("utm_medium", "onsite");
  params.set("utm_campaign", "early_access");
  params.set("utm_content", clip(input.utmContent ?? input.sourceComponent, 200));

  const q = params.toString();
  return q ? `/subscribe/?${q}` : "/subscribe/";
}

/** Hidden GET form fields for tool holding pages → /subscribe/ */
export function getSubscribeFormHiddenFields(input: SubscribeAttributionInput): Record<string, string> {
  const placement = clip(input.sourceComponent, 200);
  const utmContent = clip(input.utmContent ?? input.sourceComponent, 200);
  return {
    source_path: normalizePath(input.pagePathname),
    source_component: placement,
    utm_source: "tidesofknowing",
    utm_medium: "onsite",
    utm_campaign: "early_access",
    utm_content: utmContent,
  };
}
