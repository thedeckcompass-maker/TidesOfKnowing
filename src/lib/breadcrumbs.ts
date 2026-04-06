export type BreadcrumbItem = {
  label: string;
  url: string | null;
};

export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
  siteHref: string,
): Record<string, unknown> {
  const itemListElement = items.map((item, i) => {
    const position = i + 1;
    if (item.url) {
      const abs = new URL(item.url, siteHref).href;
      return {
        "@type": "ListItem",
        position,
        name: item.label,
        item: abs,
      };
    }
    return {
      "@type": "ListItem",
      position,
      name: item.label,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
