# Tides of Knowing Symbolic Lexicon: Card Dataset Specification and Use Rules

## 1. Purpose of this document

This document defines the structure, purpose, and rules for creating the Tides of Knowing Symbolic Lexicon card dataset.

The dataset is a structured symbolic knowledge base for tarot card interpretation. It is designed to support Tides of Knowing content, digital tools, reader training, symbolic vocabulary development, SEO and AI search visibility, daily puzzles, future learning products, and other interpretive systems.

Each tarot card must have one canonical record. That record must follow the same JSON structure and field order so that the dataset remains consistent, searchable, reusable, and easy to maintain.

This document is standalone. It does not assume prior knowledge of any previous planning discussion.

## 2. Core principle

Each card record should answer one central question:

What is this card?

A card record should define the card's identity, meanings, vocabulary, interpretive contexts, symbolic lineages, language-learning fields, search metadata, and approved uses.

A card record should not contain the logic for any one tool, website page, email system, game, or pairing engine. Those systems may use the dataset, but their operational rules should live separately.

## 3. Canonical JSON flow

Every card record must follow this top-level JSON order:

```json
{
  "metadata": {},
  "identity": {},
  "interpretation": {},
  "contexts": {},
  "vocabulary": {},
  "lineages": {},
  "translations": {},
  "semanticTags": [],
  "usageFlags": {},
  "gameMetadata": {},
  "seo": {}
}
```

Do not rename these top-level headings without a schema-level decision.

Do not reorder them casually. The order is intentional: governance first, identity second, interpretation third, then applied uses, language systems, metadata for tools, and search visibility.

## 4. File structure and storage rules

The Symbolic Lexicon lives in:

src/data/symbolic-lexicon/

Single-card tarot records live in:

src/data/symbolic-lexicon/tarot/cards/

Exact two-card pairing records live separately in:

src/data/symbolic-lexicon/pairings/tarot/

Human-readable documentation lives in:

docs/symbolic-lexicon/

JSON schemas, examples, and validation files live in:

src/data/symbolic-lexicon/tarot/schema/

Global configuration files for vocabulary levels, publication flags, and tool use live in:

src/data/symbolic-lexicon/tarot/config/

Indexes used for retrieval, filtering, and navigation live in:

src/data/symbolic-lexicon/tarot/indexes/

Single-card records must not contain exact two-card pair meanings.

Pairing records must not duplicate full single-card meanings.

Game mechanics must not be stored inside card records.

The dataset should remain modular so that future tools can read from it without changing its core structure.

## 5. Required top-level sections

### 5.1 metadata

The metadata section governs the record itself. It tracks the schema version, authorship, review status, publication readiness, and source policy.

Required structure:

```json
"metadata": {
  "schemaName": "Tides of Knowing Symbolic Lexicon Card Record",
  "schemaVersion": "1.0.0",
  "recordVersion": "1.0.0",
  "status": "draft",
  "createdBy": "Leigh Spencer",
  "createdFor": "Tides of Knowing",
  "lastUpdated": null,
  "lastReviewed": null,
  "reviewStatus": {
    "interpretive": "draft",
    "contextual": "draft",
    "lineage": "draft",
    "spanish": "needsReview",
    "seo": "draft",
    "cultural": "notApplicable"
  },
  "sourcePolicy": "Original Tides of Knowing interpretation. No copied commercial guidebook text.",
  "publicationStatus": {
    "approvedForPublicWebsite": false,
    "approvedForGameUse": false,
    "approvedForEmailUse": false,
    "approvedForPaidTraining": false,
    "approvedForInternalAiPrompting": true
  }
}
```

Rules:

The schemaVersion refers to the dataset structure.

The recordVersion refers to the individual card record.

The status should be one of:

draft
reviewed
approved
published
archived

The sourcePolicy must clearly state whether the content is original and whether any external source influenced it.

No copied commercial guidebook text should be included in the dataset.

approvedForInternalAiPrompting means the record may be used by Leigh Spencer as structured source material inside internal AI-assisted workflows. It does not mean the material is licensed for external AI training, scraping, public reuse, or third-party extraction.

### 5.2 identity

The identity section defines the card's stable symbolic identity.

Required structure:

```json
"identity": {
  "cardId": "",
  "slug": "",
  "cardName": "",
  "number": null,
  "arcana": "",
  "suit": null,
  "rank": null,
  "element": null,
  "astrologicalAssociation": {
    "primary": null,
    "secondary": null,
    "notes": ""
  },
  "visualEssence": "",
  "archetypalRole": "",
  "primaryMovement": "",
  "shadowMovement": ""
}
```

Rules:

cardId must be stable and machine-readable, for example the-fool.

slug should match the published URL slug wherever possible.

number should be used for Major Arcana and numbered Minor Arcana cards.

suit should be null for Major Arcana cards.

rank should be null unless the card has a rank, such as Ace, Two, Page, Queen, or King.

visualEssence should describe the card's symbolic image in concise interpretive language.

primaryMovement should describe what the card moves toward.

shadowMovement should describe the card's distorted, blocked, or shadow expression.

### 5.3 interpretation

The interpretation section contains the core upright and reversed meanings of the card.

Required structure:

```json
"interpretation": {
  "upright": {
    "summary": "",
    "teachingNote": "",
    "practicalMeaning": "",
    "emotionalMeaning": "",
    "relationalMeaning": "",
    "creativeMeaning": "",
    "spiritualMeaning": "",
    "shadowMeaning": ""
  },
  "reversed": {
    "summary": "",
    "teachingNote": "",
    "practicalMeaning": "",
    "emotionalMeaning": "",
    "relationalMeaning": "",
    "creativeMeaning": "",
    "spiritualMeaning": "",
    "shadowMeaning": ""
  }
}
```

Rules:

Every card must include both upright and reversed meanings.

Reversed meanings should not simply mean negative. They may indicate blockage, delay, distortion, inversion, refusal, overexpression, internalisation, shadow expression, or misalignment.

Each field should be written in original Tides of Knowing language.

Keep the wording clear enough for publication, but precise enough to support advanced interpretation.

### 5.4 contexts

The contexts section defines how the card behaves in specific applied life areas.

Approved initial contexts:

relationship
romance
business
innerDevelopment

Required structure:

```json
"contexts": {
  "relationship": {
    "upright": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    },
    "reversed": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    }
  },
  "romance": {
    "upright": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    },
    "reversed": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    }
  },
  "business": {
    "upright": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    },
    "reversed": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    }
  },
  "innerDevelopment": {
    "upright": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    },
    "reversed": {
      "essence": "",
      "keywords": [],
      "phrases": [],
      "watchFor": [],
      "readerNote": ""
    }
  }
}
```

Rules:

Use the same internal structure for every context.

relationship refers to interpersonal dynamics broadly.

romance refers specifically to romantic attraction, connection, partnership, or love readings.

business refers to work, enterprise, strategy, money, leadership, visibility, and execution.

innerDevelopment refers to selfhood, growth, identity, healing, and personal transformation.

Do not add specific two-card combination meanings into this section. This section describes the card in a life context, not the card paired with another card.

### 5.5 vocabulary

The vocabulary section powers structured interpretation, word-based learning, symbolic association, and puzzle systems.

Required structure:

```json
"vocabulary": {
  "upright": {
    "clearCurrent": {
      "keywords": [],
      "phrases": []
    },
    "deepCurrent": {
      "keywords": [],
      "phrases": []
    },
    "hiddenCurrent": {
      "keywords": [],
      "phrases": []
    }
  },
  "reversed": {
    "clearCurrent": {
      "keywords": [],
      "phrases": []
    },
    "deepCurrent": {
      "keywords": [],
      "phrases": []
    },
    "hiddenCurrent": {
      "keywords": [],
      "phrases": []
    }
  }
}
```

Rules:

Each card must include vocabulary for upright and reversed orientations.

Each orientation must include three levels:

Clear Current
Deep Current
Hidden Current

Clear Current should use recognisable tarot vocabulary.

Deep Current should use more nuanced interpretive language.

Hidden Current should use more challenging symbolic, liminal, psychological, archetypal, or shadow-aware language.

Each keyword set should ideally contain four strong terms.

Phrases may be short interpretive phrases, not full paragraphs.

Avoid generic filler terms such as good, bad, positive, negative, energy, vibe, thing, or situation.

### 5.6 lineages

The lineages section contains interpretive registers. These are not translations. They are culturally, intellectually, stylistically, or symbolically specific ways of naming the card.

Approved initial lineages:

oldEnglishInspired
norseSagaInspired
biblicalProphetic
alchemical
hermetic
greekMythicPhilosophical
jungianArchetypal
somaticEmbodied
businessStrategic
editorialJournalistic
poeticImaginal
oceanicTidal
aotearoaEcological

Required structure for each lineage:

```json
"lineages": {
  "lineageName": {
    "id": "",
    "displayName": "",
    "registerType": "",
    "status": "draft",
    "notes": "",
    "upright": {
      "keywords": [],
      "phrases": [],
      "readerNote": ""
    },
    "reversed": {
      "keywords": [],
      "phrases": [],
      "readerNote": ""
    }
  }
}
```

Approved registerType values:

inspiredRegister
symbolicRegister
interpretiveRegister
appliedRegister
brandRegister
englishLanguageEcologicalRegister

Rules:

Lineages must be labelled honestly.

Use "inspired" where the register is stylistic rather than scholarly.

Do not present Old English Inspired as literal Old English.

Do not present Norse Saga Inspired as Old Norse translation.

Do not present Biblical Prophetic as religious doctrine.

Do not include te reo Māori terms in the Aotearoa Ecological layer unless a separate cultural and linguistic review process is in place.

The Aotearoa Ecological layer should use English-language ecological, coastal, bird, weather, land, and place-aware imagery.

### 5.7 translations

The translations section is for actual language translation or language-learning use.

At present, only Spanish is approved.

Required structure:

```json
"translations": {
  "spanish": {
    "id": "spanish",
    "displayName": "Spanish",
    "status": "learningAndReview",
    "notes": "",
    "upright": {
      "keywords": [],
      "phrases": [],
      "plainMeaning": ""
    },
    "reversed": {
      "keywords": [],
      "phrases": [],
      "plainMeaning": ""
    }
  }
}
```

Rules:

Spanish terms are included as a learning layer and should be reviewed by a fluent speaker before publication.

Do not add additional languages unless there is a clear purpose and a review process.

Do not treat a lineage register as a translation.

### 5.8 semanticTags

The semanticTags section supports retrieval, filtering, internal linking, puzzle selection, search, and AI-assisted use.

Required structure:

```json
"semanticTags": []
```

Example:

```json
"semanticTags": [
  "beginning",
  "threshold",
  "risk",
  "freedom",
  "trust",
  "initiation",
  "openness",
  "unformed-potential"
]
```

Rules:

Tags should be lowercase.

Use hyphens for multi-word tags.

Tags should be stable and reusable across the dataset.

Do not use overly broad tags unless they are genuinely useful.

### 5.9 usageFlags

The usageFlags section controls where a card record may be used.

Required structure:

```json
"usageFlags": {
  "showOnPublicCardPage": false,
  "useInDailyPuzzle": false,
  "useInEmail": false,
  "useInPaidTraining": false,
  "useAsInternalAiSourceMaterial": true,
  "useInPairingSystem": false,
  "requiresReviewBeforePublication": true,
  "containsCulturallySpecificMaterial": false,
  "containsTranslationMaterial": false
}
```

Rules:

Do not publish a card publicly unless showOnPublicCardPage is true.

Do not use a card in daily puzzle content unless useInDailyPuzzle is true.

Do not use a card in paid training unless useInPaidTraining is true.

useAsInternalAiSourceMaterial means Leigh Spencer may use the record as source material in her own AI-assisted workflow. It does not mean the material is licensed for external AI training, public scraping, outside reuse, or third-party extraction.

If requiresReviewBeforePublication is true, the card should not be treated as final public content.

If Spanish or any future language translation is included, containsTranslationMaterial should be true.

If culturally specific material is included, containsCulturallySpecificMaterial should be true.

### 5.10 gameMetadata

The gameMetadata section contains optional support material for games and interactive tools. It must not contain the rules of any specific game.

Required structure:

```json
"gameMetadata": {
  "difficultyRating": {
    "clearCurrent": null,
    "deepCurrent": null,
    "hiddenCurrent": null
  },
  "confusionPairs": [],
  "dailyPuzzleSuitability": {
    "suitable": false,
    "recommendedUse": "",
    "bestPairedWith": [],
    "avoidOveruseWith": []
  },
  "beginnerFriendly": false,
  "explanationAfterSolving": {
    "upright": "",
    "reversed": ""
  },
  "spoilerText": {
    "upright": "",
    "reversed": ""
  },
  "sharePrompt": ""
}
```

Rules:

Game logic should live outside the card record.

The card record may say whether the card is suitable for puzzle use.

The card record may describe confusion pairs, but exact game mechanics should be stored separately.

confusionPairs may include cards that are easy to confuse with this card, along with distinctions.

Example:

```json
"confusionPairs": [
  {
    "cardId": "ace-of-wands",
    "similarityType": "beginning-energy",
    "distinction": "The Fool is existential beginning. Ace of Wands is creative ignition."
  }
]
```

### 5.11 seo

The seo section contains structured search and AI visibility seeds.

Required structure:

```json
"seo": {
  "metaTitle": "",
  "metaDescription": "",
  "canonicalTopic": "",
  "schemaReadyDescription": "",
  "relatedEntities": [],
  "faqSeeds": [],
  "internalLinkTargets": []
}
```

Rules:

The SEO section should provide source material for pages, not full page content.

Use clear entity signals.

Include likely search phrases naturally.

FAQ answers should be concise, accurate, and suitable for expansion into structured content.

internalLinkTargets should use stable IDs, not necessarily full URLs.

## 6. Full blank template

Use the blank JSON template stored at:

src/data/symbolic-lexicon/tarot/schema/card-record.blank-template.json

Every new card record must follow that exact structure.

## 7. Relationship to two-card meanings

This dataset may support two-card meanings, but it is not the two-card meanings dataset.

A separate two-card dataset should be used for exact pair meanings.

The single-card lexicon describes the card itself.

The two-card dataset describes what happens when two specific cards appear together.

Do not place exact card-pair meanings in this single-card record.

## 8. Relationship to games and tools

This dataset may support games, puzzles, daily email content, learning tools, search pages, and reader training.

The card record may include vocabulary, confusion pairs, suitability notes, and solving explanations.

The card record should not include full game mechanics.

Any game or tool should use its own configuration file to decide:

which cards appear
which orientation is used
which vocabulary level is shown
how scoring works
how puzzles rotate
how email delivery works

## 9. Review and approval workflow

Each card should move through the following workflow:

draft
reviewed
approved
published
archived

Suggested review sequence:

1. Create card record in draft.
2. Review identity and interpretation.
3. Review vocabulary.
4. Review contexts.
5. Review lineages.
6. Review Spanish if included.
7. Review SEO.
8. Set appropriate usage flags.
9. Approve for website, game, email, or training use as needed.

## 10. Versioning rules

Use semantic versioning for card records.

1.0.0 means initial approved record.
1.1.0 means expanded content.
1.1.1 means small correction or copy edit.
2.0.0 means structural change or major reinterpretation.

Do not make major interpretive changes without updating the record version.

## 11. Publication rules

Before a card is published publicly:

metadata.status should be approved or published.

publicationStatus.approvedForPublicWebsite should be true.

usageFlags.showOnPublicCardPage should be true.

usageFlags.requiresReviewBeforePublication should be false.

Spanish and lineage material should be reviewed if it will appear publicly.

## 12. Cultural and linguistic care

Culturally specific or historically inspired layers must be labelled accurately.

Use:

Old English Inspired
Norse Saga Inspired
Biblical Prophetic
Greek Mythic Philosophical

Do not imply scholarly translation unless the material has been professionally verified.

The Aotearoa Ecological layer should remain in English unless a specific te reo Māori review process is established.

Spanish is the only approved translation layer at this stage and should be checked before public use.

## 13. Long-term rule

The Symbolic Lexicon is a long-term intellectual asset.

It should remain modular, stable, and extensible.

The card record is the source of symbolic intelligence.

Digital tools, games, pages, emails, training resources, AI prompts, and pairing systems may draw from it, but they should not determine its structure.
