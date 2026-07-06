import { ENTITY_IDS } from "../lib/ecosystem-structured-data";

/** Public-facing author brand for the Ask Leilia customer experience. */
export const ASK_LEILIA_PUBLIC_BRAND = "Leilia – Tides of Knowing";

/** Short public name used in running copy where the full brand is not required. */
export const ASK_LEILIA_PUBLIC_NAME = "Leilia";

/** Schema.org Person node for Ask Leilia ecosystem pages (public brand; @id links to site entity). */
export function askLeiliaAuthorPersonNode(): Record<string, unknown> {
  return {
    "@type": "Person",
    "@id": ENTITY_IDS.person,
    name: ASK_LEILIA_PUBLIC_BRAND,
    alternateName: ASK_LEILIA_PUBLIC_NAME,
  };
}

export const LEILIA_PORTRAIT_PATH = "/images/about/leigh-spencer-profile.png";

export const LEILIA_PORTRAIT_ALT =
  "Professional portrait of Leilia – Tides of Knowing, smiling outdoors in a park setting.";

export type AskLeiliaReading = {
  name: string;
  intro: string;
  features: string[];
  price: string;
  requestHref: string;
  ctaLabel?: string;
};

export const ASK_LEILIA_READINGS: AskLeiliaReading[] = [
  {
    name: "One Question Reading",
    intro: "Ideal when you have one clear question or decision.",
    features: [
      "One clearly defined question",
      "Three-card professionally interpreted reading",
      "Personally written by Leilia",
      "Professionally formatted PDF",
      "Delivered within 48 hours",
    ],
    price: "US$25",
    requestHref: "/ask-leilia/request/",
    ctaLabel: "Request This Reading",
  },
  {
    name: "In-Depth Reading",
    intro: "Explore one important area of your life in greater depth.",
    features: [
      "One important question or life area",
      "Spread selected to suit your question",
      "Detailed written interpretation",
      "Personally written by Leilia",
      "Professionally formatted PDF",
      "Delivered within 48 hours",
    ],
    price: "US$75",
    requestHref: "/ask-leilia/request/in-depth/",
    ctaLabel: "Request This Reading",
  },
  {
    name: "Personal Guidance Reading",
    intro: "A comprehensive reading for multiple questions or life areas.",
    features: [
      "Multiple questions or themes",
      "Comprehensive written consultation",
      "Practical guidance and interpretation",
      "Personally written by Leilia",
      "Professionally formatted PDF",
      "Delivered within 48 hours",
    ],
    price: "US$150",
    requestHref: "/ask-leilia/request/personal-guidance/",
    ctaLabel: "Request This Reading",
  },
];

export const ASK_LEILIA_PUBLIC_TRUST_POINTS = [
  "Personally interpreted by Leilia",
  "Human-led. Never AI generated.",
  "Delivered as a professionally formatted PDF",
  "Delivered within 48 hours",
];

export const LEILIA_GIFT_TRUST_POINTS = [
  "Personally interpreted by Leilia",
  "Human-led. Never AI generated.",
  "Professionally written PDF",
  "Delivered within 48 hours",
];

export const LEILIA_GIFT_FEATURES = [
  {
    title: "One Question",
    description: "A focused reading exploring one clearly defined question.",
  },
  {
    title: "Professional PDF",
    description:
      "Your reading is professionally written and delivered as a PDF you can keep and revisit.",
  },
  {
    title: "Personally Prepared",
    description:
      "Every reading is interpreted and written personally by Leilia. No AI is used in the interpretation or writing.",
  },
];

export const LEILIA_GIFT_EXPLORE_LINKS = [
  {
    title: "Ask Leilia",
    href: "/ask-leilia/",
    description:
      "Explore professional written tarot readings for when you would like guidance beyond this complimentary invitation.",
  },
  {
    title: "About Leilia",
    href: "/about/",
    description:
      "Learn more about Leilia – Tides of Knowing, her background in tarot, journalism, and symbolic interpretation.",
  },
  {
    title: "Reading Library",
    href: "/recent-client-readings/",
    linkLabel: "Reading Library",
    description:
      "Browse anonymised examples of professionally written, personally interpreted tarot readings.",
  },
  {
    title: "Tides of Knowing Home",
    href: "/",
    description:
      "Visit the home of Tides of Knowing to explore articles, tools, and the wider body of work.",
  },
];
