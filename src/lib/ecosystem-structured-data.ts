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
    url: `${DECK_COMPASS_ORIGIN}/about`,
    jobTitle: "Founder",
    description:
      "Founder of Tides of Knowing™ and The Deck Compass™, journalist, and creator of the COMPASS Method.",
    worksFor: [{ "@id": IDS.tidesOrg }, { "@id": IDS.deckOrg }],
    knowsAbout: [
      "Intuitive tarot and oracle reading",
      "Symbolic perception",
      "the COMPASS Method",
    ],
  };
}

export function compassMethodCreativeWorkNode() {
  return {
    "@type": "CreativeWork",
    "@id": IDS.compassMethod,
    name: "the COMPASS Method",
    alternateName: "COMPASS Method",
    description:
      "A shared interpretive framework for relational tarot and oracle reading, organised as seven pillars of attention for live practice.",
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
      "Editorial and methodology environment for symbolic perception, intuitive reading, and long-form work on tarot and oracle practice.",
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
      "Essays, research, and conceptual foundations for intuitive reading and the COMPASS Method.",
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
