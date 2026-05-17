import type { MarkdownHeading } from "astro";

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
