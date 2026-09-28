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
  /** Stable Reading Library taxonomy label for schema/offer matching. */
  libraryTypeLabel: "One Question" | "In-Depth" | "Personal Guidance";
  /** Optional restrained sub-title shown beneath the name. */
  descriptor?: string;
  /** Single concise positioning statement shown on the card. */
  positioning: string;
  /** Three concise visible key points. */
  keyPoints: string[];
  /** Accessible label for the disclosure button, e.g. "More information about the In-Depth Reading". */
  moreInfoLabel: string;
  /** Fuller explanation revealed by the disclosure, one entry per paragraph. */
  moreInfo: string[];
  price: string;
  requestHref: string;
  ctaLabel?: string;
};

export const ASK_LEILIA_DELIVERABLES = {
  "one-question": [
    "Written PDF with a photograph of the spread",
    "Delivered within 48 hours",
  ],
  "in-depth": [
    "Detailed written PDF with photographs of the spreads",
    "Delivered within 48 hours",
  ],
  "personal-guidance": [
    "Comprehensive written PDF with photographs of the Waka Spread",
    "Delivered within 48 hours",
  ],
} as const;

/** Public labels for the What You Receive section (keys match deliverable product IDs). */
export const ASK_LEILIA_DELIVERABLE_PUBLIC_LABELS = {
  "one-question": "One Question Reading",
  "in-depth": "In-Depth Reading",
  "personal-guidance": "Personal Guidance Reading",
} as const;

export const ASK_LEILIA_READINGS: AskLeiliaReading[] = [
  {
    name: "One Question Reading",
    libraryTypeLabel: "One Question",
    positioning: "For one focused question that needs a clear, complete answer.",
    keyPoints: [
      "The spread is chosen to suit your question",
      "As many cards as the answer requires",
      "Written PDF with a photograph of the spread",
    ],
    moreInfoLabel: "More information about the One Question Reading",
    moreInfo: [
      "Bring one clearly defined question. I choose the spread most appropriate to what you are asking and draw as many cards as needed to answer it properly. There is no arbitrary card limit and no automated interpretation. You receive a professionally presented written PDF with a photograph of your spread.",
    ],
    price: "US$45",
    requestHref: "/ask-leilia/request/",
    ctaLabel: "Ask My Question",
  },
  {
    name: "In-Depth Reading",
    libraryTypeLabel: "In-Depth",
    positioning: "For a complex situation, connected questions, or a decision with more than one layer.",
    keyPoints: [
      "Untangle the pressures behind one connected situation",
      "See your options and what may be shaping them",
      "Detailed written PDF with spread photographs",
    ],
    moreInfoLabel: "More information about the In-Depth Reading",
    moreInfo: [
      "Choose this reading when the issue cannot be reduced to one contained question. You may bring one complex situation, several connected concerns, a decision with competing options, or a pattern affecting different parts of your life. I choose the spread or combination of spreads that best fits what you bring. By following the relationships between the cards, I help you see the pressures and choices within that situation more clearly, and where your next step may lie. You receive a detailed written PDF with photographs of the spreads.",
    ],
    price: "US$75",
    requestHref: "/ask-leilia/request/in-depth/",
    ctaLabel: "Explore My Situation",
  },
  {
    name: "Personal Guidance Reading",
    libraryTypeLabel: "Personal Guidance",
    descriptor: "Includes Leilia’s signature Waka Spread.",
    positioning:
      "For a deep reading of the wider patterns shaping your path, including what you may not yet know to ask.",
    keyPoints: [
      "Signature fourteen-card Waka Spread explores your wider path",
      "Intuitive insight shaped by journalism and business experience",
      "Comprehensive written guidance with Waka Spread photographs",
    ],
    moreInfoLabel: "More information about the Personal Guidance Reading",
    moreInfo: [
      "Bring the questions or concerns that matter most, but the reading is not confined to them. This Personal Guidance Reading connects what you already see with wider patterns and influences, including what you may not yet have realised you needed to ask about. It helps you recognise what deserves your attention and where you can make a meaningful choice.",
      "At its centre is my signature fourteen-card Waka Spread. Nine cards explore the structure of the person's journey, including foundation, capacity, purpose, momentum, agency, what is being left behind, and what is emerging ahead. Five further cards reveal the conditions acting on that journey.",
      "I draw on forty years of intuitive practice, thirty years of journalism, and my experience in business and mentoring to bring the pieces together. I read the cards individually and in relationship, with channelled insight and ancestral guidance, to offer a considered view of what is shaping your path. You receive a comprehensive written PDF with photographs of the Waka Spread.",
    ],
    price: "US$150",
    requestHref: "/ask-leilia/request/personal-guidance/",
    ctaLabel: "Begin My Personal Guidance Reading",
  },
];

export const ASK_LEILIA_PUBLIC_TRUST_POINTS = [
  "Every reading is interpreted personally by Leilia",
  "Every reading includes a written PDF and spread imagery",
  "Personal Guidance centres on Leilia’s signature fourteen-card Waka Spread",
  "No automated or AI-generated interpretation",
  "Delivered within 48 hours",
];

/** Compact purchase-reassurance strip beneath the offer cards. */
export const ASK_LEILIA_PURCHASE_REASSURANCE = [
  "Personally interpreted by Leilia",
  "Written PDF and spread imagery with every reading",
  "Delivered within 48 hours",
  "Signature Waka Spread included with Personal Guidance",
] as const;

/** Concise closing-offer summaries for the final purchase invitation (sales page). */
export const ASK_LEILIA_CLOSING_OFFERS = [
  {
    id: "one-question" as const,
    name: "One Question Reading",
    price: "US$45",
    summary: "One focused question that needs a clear, complete answer.",
    compactSummary: "A focused reading for one clear, specific question.",
    ctaLabel: "Ask My Question",
    requestHref: "/ask-leilia/request/",
  },
  {
    id: "in-depth" as const,
    name: "In-Depth Reading",
    price: "US$75",
    summary: "Understand the pressures and choices within one complex situation.",
    compactSummary:
      "Untangle one complex situation or layered decision and see your options more clearly.",
    ctaLabel: "Explore My Situation",
    requestHref: "/ask-leilia/request/in-depth/",
  },
  {
    id: "personal-guidance" as const,
    name: "Personal Guidance Reading",
    price: "US$150",
    summary: "A comprehensive reading of your wider path using Leilia’s Waka Spread and the full range of her experience.",
    compactSummary:
      "See the wider patterns shaping your path and where you can make a meaningful choice.",
    ctaLabel: "Begin My Personal Guidance Reading",
    requestHref: "/ask-leilia/request/personal-guidance/",
  },
] as const;

/**
 * Preferred seed review IDs for the upper compact proof section.
 * Chosen for specificity (clarity, interpretive process), not generic praise.
 */
export const ASK_LEILIA_PROOF_REVIEW_IDS = [
  "c5e1f8a0-0708-4111-8b25-00a5c1e11001", // Sarah — emotional bias / clearer perspective
  "c5e1f8a0-0712-4111-8b25-00a5c1e11003", // Anonymous — how the cards were read
] as const;

export type AskLeiliaSalesSamplePreview = {
  slug: string;
  firstName: string;
  title: string;
  description: string;
  imagePath: string;
  href: string;
};

/** Authorised sample previews for the Ask Leilia sales page (fixed public slugs). */
export const ASK_LEILIA_SALES_SAMPLE_PREVIEWS: AskLeiliaSalesSamplePreview[] = [
  {
    slug: "hannah-rebrand-reading",
    firstName: "Hannah",
    title: "Rebranding a Tea Blend",
    description:
      "A reading on creative direction and how a tea blend wants to be understood in the world.",
    imagePath: "/images/client-readings/hannah-rebrand-reading/hannah-rebrand-reading-1.jpg",
    href: "/recent-client-readings/hannah-rebrand-reading/",
  },
  {
    slug: "sasha-two-jobs-reading",
    firstName: "Sasha",
    title: "Choosing Between Two Job Offers",
    description:
      "A decision reading that weighs two professional paths and the pressures shaping the choice.",
    imagePath: "/images/client-readings/sasha-two-jobs-reading/sasha-two-jobs-reading-1.jpg",
    href: "/recent-client-readings/sasha-two-jobs-reading/",
  },
  {
    slug: "shelly-twelve-month-reading",
    firstName: "Shelly",
    title: "Twelve-Month Workplace Reading",
    description:
      "A year-ahead workplace reading that follows the arc of responsibility, pressure, and change.",
    imagePath: "/images/client-readings/shelly-twelve-month-reading/shelly-twelve-month-reading-1.jpg",
    href: "/recent-client-readings/shelly-twelve-month-reading/",
  },
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
