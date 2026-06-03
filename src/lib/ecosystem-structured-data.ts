/**
 * Canonical ecosystem entities for The Deck Compass™ and Tides of Knowing™.
 * Keep in lockstep with `tdc_button_system/src/lib/ecosystem-structured-data.ts` (@id values must match).
 */

export const DECK_COMPASS_ORIGIN = "https://www.thedeckcompass.com";
export const TIDES_OF_KNOWING_ORIGIN = "https://www.tidesofknowing.com";

export const ENTITY_IDS = {
  person: `${TIDES_OF_KNOWING_ORIGIN}/#leigh-spencer`,
  compassMethod: `${TIDES_OF_KNOWING_ORIGIN}/#the-compass-method`,
  tidesOrg: `${TIDES_OF_KNOWING_ORIGIN}/#organization`,
  tidesWebSite: `${TIDES_OF_KNOWING_ORIGIN}/#website`,
  deckOrg: `${DECK_COMPASS_ORIGIN}/#organization`,
  deckWebSite: `${DECK_COMPASS_ORIGIN}/#website`,
} as const;

const IDS = ENTITY_IDS;

export function leighSpencerPersonNode() {
  return {
    "@type": "Person",
    "@id": IDS.person,
    name: "Leigh Spencer",
    url: `${TIDES_OF_KNOWING_ORIGIN}/about/`,
    sameAs: [`${DECK_COMPASS_ORIGIN}/about`],
    jobTitle: "Founder",
    description:
      "Fourth-generation Matakite (seer), founder of Tides of Knowing™ and The Deck Compass™, journalist, and creator of The COMPASS Method™.",
    worksFor: [{ "@id": IDS.tidesOrg }, { "@id": IDS.deckOrg }],
    knowsAbout: [
      "Symbolic perception",
      "Intuitive discernment",
      "Interpretive intelligence",
      "The COMPASS Method",
      "Tarot and oracle reading",
      "Reflective practice",
    ],
  };
}

export function compassMethodCreativeWorkNode() {
  return {
    "@type": "CreativeWork",
    "@id": IDS.compassMethod,
    name: "The COMPASS Method™",
    alternateName: ["COMPASS Method", "The COMPASS Method"],
    description:
      "An interpretive framework for symbolic perception, intuitive discernment, and relational reading—organised as seven pillars of attention, practised through tarot and oracle.",
    inLanguage: "en",
    creator: { "@id": IDS.person },
    publisher: { "@id": IDS.tidesOrg },
    isPartOf: { "@id": IDS.tidesWebSite },
  };
}

export function tidesOfKnowingOrganizationNode() {
  return {
    "@type": "Organization",
    "@id": IDS.tidesOrg,
    name: "Tides of Knowing™",
    url: TIDES_OF_KNOWING_ORIGIN,
    description:
      "Editorial home for symbolic perception, interpretive intelligence, and The COMPASS Method™—with tarot and oracle as the disciplined practice environment for reflective reading.",
    founder: { "@id": IDS.person },
    subjectOf: { "@id": IDS.compassMethod },
  };
}

export function tidesOfKnowingWebSiteNode() {
  return {
    "@type": "WebSite",
    "@id": IDS.tidesWebSite,
    name: "Tides of Knowing™",
    url: TIDES_OF_KNOWING_ORIGIN,
    description:
      "Essays, tools, and frameworks on symbolic perception, intuitive discernment, and The COMPASS Method™—grounded in tarot and oracle practice and interpretive intelligence for reflective readers.",
    publisher: { "@id": IDS.tidesOrg },
    about: { "@id": IDS.compassMethod },
  };
}

export function deckCompassOrganizationNode() {
  return {
    "@type": "Organization",
    "@id": IDS.deckOrg,
    name: "The Deck Compass™",
    url: DECK_COMPASS_ORIGIN,
    description:
      "Applied practice and reflective development environment for tarot and oracle readers—live sessions, journaling, and cohort pathways.",
    founder: { "@id": IDS.person },
    subjectOf: { "@id": IDS.compassMethod },
  };
}

export function deckCompassWebSiteNode() {
  return {
    "@type": "WebSite",
    "@id": IDS.deckWebSite,
    name: "The Deck Compass™",
    url: DECK_COMPASS_ORIGIN,
    description:
      "Where the COMPASS Method is practised: participation, ethics, training interest, and reflective reader development.",
    publisher: { "@id": IDS.deckOrg },
    about: { "@id": IDS.compassMethod },
  };
}

export function getEcosystemJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      leighSpencerPersonNode(),
      compassMethodCreativeWorkNode(),
      tidesOfKnowingOrganizationNode(),
      tidesOfKnowingWebSiteNode(),
      deckCompassOrganizationNode(),
      deckCompassWebSiteNode(),
    ],
  };
}
