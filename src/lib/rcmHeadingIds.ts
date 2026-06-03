import type { MarkdownHeading } from "astro";
import { normalizeComparableText } from "./textNormalize";

/** Scoped document fragment id: `majors--the-fool--core-repeating-message`. */
export function scopedHeadingId(panelDomId: string, baseSlug: string): string {
  return `${panelDomId}--${baseSlug}`;
}

/** Prefix every heading `id` in pre-rendered markdown HTML for unique in-page anchors. */
export function prefixHeadingIdsInHtml(html: string, panelDomId: string): string {
  return html.replace(/<(h[1-6])(\s[^>]*)>/gi, (match, tag: string, attrs: string) => {
    if (!/\sid="/i.test(attrs)) return match;
    const nextAttrs = attrs.replace(
      /\sid="([^"]+)"/i,
      (_full, baseSlug: string) => ` id="${scopedHeadingId(panelDomId, baseSlug)}"`,
    );
    return `<${tag}${nextAttrs}>`;
  });
}

/** Sidebar links from Astro markdown headings, with panel-scoped fragment ids. */
export function buildScopedSectionNav(
  headings: MarkdownHeading[],
  panelDomId: string,
): { slug: string; text: string }[] {
  return headings
    .filter((heading) => heading.depth === 2)
    .map((heading) => ({
      slug: scopedHeadingId(panelDomId, heading.slug),
      text: heading.text,
    }));
}

function stripHtmlTags(fragment: string): string {
  return fragment.replace(/<[^>]+>/g, "").trim();
}

/** True when rendered H1 text duplicates the template hero title. */
export function isDuplicateRepeatingCardTitleH1(
  h1InnerHtml: string,
  displayTitle: string,
  entryTitle?: string,
): boolean {
  const text = normalizeComparableText(stripHtmlTags(h1InnerHtml));
  if (!text) return false;

  const display = normalizeComparableText(displayTitle);
  const candidates = new Set<string>([display, `${display} repeating meaning`]);

  const trimmedEntry = entryTitle?.trim();
  if (trimmedEntry) {
    const entryNorm = normalizeComparableText(trimmedEntry);
    candidates.add(entryNorm);
    candidates.add(
      normalizeComparableText(trimmedEntry.replace(/\s+repeating meaning$/i, "")),
    );
  }

  if (candidates.has(text)) return true;
  if (text.endsWith(" repeating meaning")) {
    const base = text.replace(/\s+repeating meaning$/, "");
    if (candidates.has(base)) return true;
  }
  return false;
}

/** Drop the first body H1 when it restates the hero; demote any remaining H1 to H2. */
export function normalizeRepeatingCardArticleHtml(
  html: string,
  displayTitle: string,
  entryTitle?: string,
): string {
  let removedLeadingTitle = false;
  let normalized = html.replace(
    /<h1(\s[^>]*)?>([\s\S]*?)<\/h1>/i,
    (match, _attrs: string, inner: string) => {
      if (removedLeadingTitle) return match;
      if (!isDuplicateRepeatingCardTitleH1(inner, displayTitle, entryTitle)) {
        return match;
      }
      removedLeadingTitle = true;
      return "";
    },
  );

  normalized = normalized.replace(/<(\/?)h1(\s[^>]*)?>/gi, (_match, close: string, attrs = "") => {
    if (close === "/") return "</h2>";
    return `<h2${attrs}>`;
  });

  return normalized;
}
