export interface CompassMeta {
  title: string;
  description: string;
}

export interface CompassHero {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
}

export interface CompassInvestmentTier {
  title: string;
  body: string[];
}

export interface CompassFaqItem {
  q: string;
  /** Trusted HTML (static strings only). */
  a: string;
}

export type CohortScheduleNz = {
  variant: "nz";
  label: string;
  heading: string;
  introParagraphs: string[];
  cohortCards: { title: string; status: string }[];
  sessionWindowsSubheading: string;
  sessionWindowCards: { title: string; lines: string[] }[];
  fromAugustHeading: string;
  fromAugustLead: string;
  fromAugustBullets: string[];
  usWaitParagraph: string;
  registerInterest: { text: string; href: string };
};

export type CohortScheduleMexico = {
  variant: "mexico";
  label: string;
  heading: string;
  introParagraphs: string[];
  /** Month or period label and factual status (e.g. booked, unavailable). */
  availabilityItems: { period: string; status: string }[];
  timezoneParagraphs: string[];
  /** Optional closing line after schedule context. */
  closingParagraph?: string;
};

export type CohortScheduleContent = CohortScheduleNz | CohortScheduleMexico;

export interface CompassTrainingPage {
  id: "nz" | "mexico";
  meta: CompassMeta;
  hero: CompassHero;
  trainingPractice: { heading: string; paragraphs: string[] };
  problemFit: { label: string; heading: string; bullets: string[] };
  method: { label: string; heading: string; pillars: string[]; paragraphs: string[] };
  learningOutcomes: { label: string; heading: string; intro: string; bullets: string[] };
  howItWorks: {
    label: string;
    heading: string;
    intro: string;
    bullets: string[];
    closingParagraphs: string[];
  };
  cohortSchedule: CohortScheduleContent;
  investment: {
    label: string;
    heading: string;
    intro: string;
    tiers: CompassInvestmentTier[];
    afterHeading: string;
    afterParagraphs: string[];
  };
  about: { label: string; heading: string; paragraphs: string[] };
  faq: { label: string; heading: string; items: CompassFaqItem[] };
  apply: {
    label: string;
    heading: string;
    intro: string;
    checklist: string[];
    note: string;
    ctaLabel: string;
    ctaHref: string;
  };
  footerAttribution: string;
}
