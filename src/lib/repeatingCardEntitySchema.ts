import type { CollectionEntry } from "astro:content";
import { AUTHOR_NAME } from "./blogSeo";
import { breadcrumbJsonLd } from "./breadcrumbs";
import { ENTITY_IDS } from "./ecosystem-structured-data";
import {
  cardHeadline,
  getRepeatingCardBreadcrumbs,
  getRepeatingCardEntityBreadcrumbJsonLd,
  getRepeatingCardMetaDescription,
  getRepeatingCardMetaTitle,
} from "./repeatingCardSeo";
import { repeatingCardPanelSummary, repeatingCardSlugFromId } from "./repeatingCardMeanings";
import { tarotCardImagePath } from "./tarotCardImage";
import { getRepeatingCardCanonicalUrl } from "./repeatingCardUrls";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

const ABOUT_TOPIC = "repeating tarot card meanings";

function articleDescription(entry: RepeatingCardEntry): string {
  const summary = repeatingCardPanelSummary(entry)?.trim();
  if (summary) return summary;
  return getRepeatingCardMetaDescription(entry);
}

function optionalIsoDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

type GraphVariant = "entity" | "tool";

function buildRepeatingCardSchemaGraph(
  entry: RepeatingCardEntry,
  siteHref: string,
  variant: GraphVariant,
): Record<string, unknown> {
  const canonical = getRepeatingCardCanonicalUrl(entry, siteHref);
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const pageTitle = getRepeatingCardMetaTitle(entry);
  const headline = cardHeadline(entry);
  const webDescription = getRepeatingCardMetaDescription(entry);
  const imagePath = tarotCardImagePath(repeatingCardSlugFromId(entry.id));
  const image = new URL(imagePath, siteHref).href;

  const breadcrumbLd =
    variant === "entity"
      ? getRepeatingCardEntityBreadcrumbJsonLd(entry, siteHref)
      : breadcrumbJsonLd(getRepeatingCardBreadcrumbs(entry), siteHref);

  const article: Record<string, unknown> = {
    "@type": "Article",
    "@id": articleId,
    headline: pageTitle,
    description: articleDescription(entry),
    url: canonical,
    mainEntityOfPage: { "@id": webpageId },
    author: { "@id": ENTITY_IDS.person },
    publisher: { "@id": ENTITY_IDS.tidesOrg },
    image,
    about: [
      { "@type": "Thing", name: headline },
      { "@type": "Thing", name: ABOUT_TOPIC },
    ],
    mentions: [{ "@id": ENTITY_IDS.compassMethod }],
  };

  const datePublished = optionalIsoDate(entry.data.datePublished);
  const dateModified = optionalIsoDate(entry.data.dateModified);
  if (datePublished) article.datePublished = datePublished;
  if (dateModified) article.dateModified = dateModified;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: canonical,
      name: pageTitle,
      description: webDescription,
      inLanguage: "en-NZ",
      isPartOf: { "@id": ENTITY_IDS.tidesWebSite },
      publisher: { "@id": ENTITY_IDS.tidesOrg },
      author: {
        "@type": "Person",
        name: AUTHOR_NAME,
        "@id": ENTITY_IDS.person,
      },
      mainEntity: { "@id": articleId },
    },
    article,
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbLd.itemListElement,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/** JSON-LD `@graph` for canonical `/repeating-card-meanings/{slug}/` pages. */
export function getRepeatingCardEntityPageJsonLd(
  entry: RepeatingCardEntry,
  siteHref: string,
): Record<string, unknown> {
  return buildRepeatingCardSchemaGraph(entry, siteHref, "entity");
}

/**
 * JSON-LD for tool deep-links: Article and BreadcrumbList only (no WebPage, no FAQ).
 * Article `url` and `mainEntityOfPage` use the entity canonical URL.
 */
export function getRepeatingCardToolPageJsonLd(
  entry: RepeatingCardEntry,
  siteHref: string,
): Record<string, unknown> {
  const canonical = getRepeatingCardCanonicalUrl(entry, siteHref);
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const pageTitle = getRepeatingCardMetaTitle(entry);
  const headline = cardHeadline(entry);
  const imagePath = tarotCardImagePath(repeatingCardSlugFromId(entry.id));
  const image = new URL(imagePath, siteHref).href;
  const breadcrumbLd = breadcrumbJsonLd(getRepeatingCardBreadcrumbs(entry), siteHref);

  const article: Record<string, unknown> = {
    "@type": "Article",
    "@id": articleId,
    headline: pageTitle,
    description: articleDescription(entry),
    url: canonical,
    mainEntityOfPage: { "@id": webpageId },
    author: { "@id": ENTITY_IDS.person },
    publisher: { "@id": ENTITY_IDS.tidesOrg },
    image,
    about: [
      { "@type": "Thing", name: headline },
      { "@type": "Thing", name: ABOUT_TOPIC },
    ],
    mentions: [{ "@id": ENTITY_IDS.compassMethod }],
  };

  const datePublished = optionalIsoDate(entry.data.datePublished);
  const dateModified = optionalIsoDate(entry.data.dateModified);
  if (datePublished) article.datePublished = datePublished;
  if (dateModified) article.dateModified = dateModified;

  return {
    "@context": "https://schema.org",
    "@graph": [
      article,
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbLd.itemListElement,
      },
    ],
  };
}
