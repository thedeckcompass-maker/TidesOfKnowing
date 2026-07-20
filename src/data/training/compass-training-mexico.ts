import type { CompassTrainingPage } from "./types";

/**
 * Historical Mexico training copy module.
 * Do not use as the public `/compass/` source of truth.
 * Live page metadata: `compass-page.ts`. Live cohorts: `compass-cohorts.ts`.
 * Retained only so archived docs/routes that still import the symbol do not break.
 * Commercial content below matches the single US$997 flagship offer.
 */
export const compassTrainingMexico: CompassTrainingPage = {
  id: "mexico",
  meta: {
    title: "The COMPASS Method™ Live Tarot Training | Tides of Knowing",
    description:
      "A four-week live training for tarot and oracle readers ready to decode intuitive information, organise interpretation, and communicate what they perceive with greater clarity and confidence.",
  },
  hero: {
    eyebrow: "Live practitioner training",
    heading: "The COMPASS Method™ Live Practitioner Training",
    paragraphs: [
      "Learn to recognise and accurately decode the information that arrives before words, then give it a reliable structure for interpretation.",
      "COMPASS is structured live training in human discernment, intuitive structure, and grounded interpretation for tarot and oracle readers who already understand the language of their cards.",
    ],
  },
  trainingPractice: {
    heading: "Training and practice are not the same thing",
    paragraphs: [
      "Training installs the method. Practice stabilises it.",
      "The COMPASS programme is where the framework is taught directly. The Deck Compass is where repeated live practice and reflection help the habits take root.",
      "Students complete training and move directly into The Deck Compass with three months of platform access included.",
    ],
  },
  problemFit: {
    label: "Problem fit",
    heading: "If This Sounds Like You",
    bullets: [
      "You sense something real in the spread, but lack a framework for working with it step by step",
      "You read naturally, but want more structure, consistency, and confidence from session to session",
      "You know the meanings, yet your readings still feel uncertain or hard to articulate",
      "You start strong, then lose the thread halfway through",
      "You over-explain instead of saying what you actually see",
      "You feel intuitive hits, then immediately doubt them",
      "You keep looking for the right meaning instead of trusting your read",
    ],
  },
  method: {
    label: "Method",
    heading: "The COMPASS Method™",
    pillars: ["Center", "Open", "Map", "Perceive", "Align", "Sense", "Seal"],
    paragraphs: [
      "This is not about collecting more card meanings. It is about practical intuitive development: how attention is held before interpretation, while it forms, and when the reading closes.",
      "An original interpretive framework created by Tides of Knowing: The COMPASS Method™.",
    ],
  },
  learningOutcomes: {
    label: "Learning outcomes",
    heading: "What You Will Learn",
    intro:
      "Most tarot training focuses on what the cards mean. COMPASS focuses on what the reader is doing with perception, language, and discernment.",
    bullets: [
      "Trust and articulate intuitive signal without collapsing into performance or guesswork",
      "Strengthen discernment between projection, habit, and what the spread is actually doing",
      "Stay with what is unfolding and communicate it clearly for clients and for yourself",
    ],
  },
  howItWorks: {
    label: "Process",
    heading: "How It Works",
    intro:
      "This is a live, discussion-based programme in a small cohort so mentorship and direct feedback stay central.",
    bullets: [
      "Four live teaching sessions of 60–90 minutes",
      "Almost three weeks of guided application",
      "Maximum six participants per cohort",
      "Every confirmed cohort proceeds, even with one participant",
      "Live only, not replay-based",
    ],
    closingParagraphs: [
      "Enrolment is direct. Choose your cohort, confirm your details, and complete payment to reserve your place.",
    ],
  },
  cohortSchedule: {
    variant: "mexico",
    label: "Availability",
    heading: "Choose your cohort",
    introParagraphs: [
      "Two cohorts begin each month. Sessions run at 7:00–8:30 pm Mexico City time (CST / UTC−6).",
      "Enrolment closes 48 hours before the first session.",
    ],
    availabilityItems: [
      { period: "Beginning-of-month cohort", status: "Open when places remain" },
      { period: "Mid-month cohort", status: "Open when places remain" },
    ],
    timezoneParagraphs: [
      "All sessions are listed in America/Mexico_City time. Confirm the conversion for your location before enrolling.",
    ],
    closingParagraph:
      "Cohorts are capped at six because live discussion, feedback, and observation require small numbers.",
  },
  investment: {
    label: "Investment",
    heading: "One complete offer",
    intro: "The COMPASS Method™ Live Practitioner Training.",
    tiers: [
      {
        title: "COMPASS Live Practitioner Training · USD $997",
        body: [
          "Four live teaching sessions, almost three weeks of guided application, one observed seeker reading with private feedback, journal sharing and review through The Deck Compass, and three months of Deck Compass membership.",
          "Included membership value: US$117. After the complimentary period, membership continues at US$39 per month if you choose to remain.",
        ],
        enrollHref: "https://buy.stripe.com/cNi9ASeie24O8ea9f57N603",
      },
    ],
    afterHeading: "After the three months",
    afterParagraphs: [
      "Three months of The Deck Compass are included. After that, platform access continues at USD $39 per month if you choose to remain a member.",
    ],
  },
  about: {
    label: "Authority",
    heading: "About Leigh Spencer",
    paragraphs: [
      "Leigh Spencer is a fourth-generation Matakite, tarot practitioner of more than 40 years, professional journalist and editor of more than 30 years, and founder of The COMPASS Method™.",
      "COMPASS grew from the meeting point between intuitive perception and editorial discipline.",
    ],
  },
  notFor: {
    label: "Boundaries",
    heading: "Who this is not for",
    bullets: [
      "Complete beginners learning card meanings from scratch.",
      "People wanting a passive, self-paced course.",
      "Readers wanting AI-generated interpretations instead of strengthening their own perception.",
    ],
  },
  faq: {
    label: "FAQ",
    heading: "Common Questions",
    items: [
      {
        q: "How do I enrol?",
        a: "Choose a cohort by its start date on the COMPASS page, enter your details, confirm attendance and terms, then continue to payment. Your place is reserved only after payment is completed.",
      },
      {
        q: "What level do I need to be at?",
        a: "You should already be reading tarot or oracle cards and understand the basics. This work is about improving how you read, not learning meanings from scratch.",
      },
    ],
  },
  apply: {
    label: "Enrol",
    heading: "Choose your cohort",
    intro: "Select a cohort on the COMPASS page and complete enrolment there.",
    checklist: [
      "Choose a beginning-of-month or mid-month cohort",
      "Confirm you can attend the four live sessions",
      "Complete payment to reserve your place",
    ],
    note: "Enrolment is handled on /compass/. Interest registration is no longer the primary path.",
    ctaLabel: "Go to COMPASS enrolment",
    ctaHref: "/compass/#choose-your-cohort",
  },
  footerAttribution:
    "An original interpretive framework created by Tides of Knowing: The COMPASS Method™.",
};
