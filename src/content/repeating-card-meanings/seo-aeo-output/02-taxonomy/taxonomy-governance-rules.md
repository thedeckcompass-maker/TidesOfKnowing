# Taxonomy Governance Rules
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 2 — Taxonomy

---

## Purpose

This document defines the rules for assigning, maintaining, extending, and deprecating taxonomy terms across the Tides of Knowing Repeating Card Meanings system. All contributors and automated systems should consult this document before modifying taxonomy assignments or adding new terms.

---

## Naming Rules

1. All taxonomy terms use lowercase kebab-case: `material-security` not `Material Security` or `materialSecurity`
2. Terms are singular where they describe a state or pattern: `grief-processing` not `grief-processings`
3. Terms are hyphenated compounds where they describe a combined concept: `self-worth` not `selfworth`
4. Terms must be unambiguous in isolation: `control` is too vague; `control-through-giving` is specific enough
5. Terms should describe a psychological or behavioural pattern, not a tarot keyword: use `threshold-paralysis` not `indecision`
6. Terms must be usable as URL-safe filter values (no spaces, no special characters, no uppercase)

---

## Plural vs Singular Rules

- All terms are singular noun phrases describing a state, pattern, or concept
- Vocabulary list headings are plural (e.g., `themes`, `seeker_states`) but individual terms are singular
- In YAML, terms appear as array items under their vocabulary key

Example (correct):
```yaml
themes:
  - material-security
  - creative-ignition
```

Example (incorrect):
```yaml
themes:
  - material securities
  - creative ignitions
```

---

## Synonym Handling

When two terms describe overlapping concepts:
- Choose the more specific term
- Redirect the vaguer term to the more specific one in this document
- Do not assign both overlapping terms to the same card unless they genuinely describe distinct aspects of that card's pattern

Managed synonyms:

| Deprecated / Avoided | Canonical Term | Reason |
|---------------------|---------------|--------|
| `avoidance` | `emotional-avoidance` or `relational-avoidance` | Too vague |
| `fear` | `anticipatory-anxiety` or `chronic-vigilance` | Too vague; not psychologically specific |
| `control` | `control-through-giving`, `accumulation-as-safety`, or `authority-resistance` | Too vague |
| `confusion` | `stuck-in-ambivalence` or `cognitive-entrapment` | Too vague |
| `healing` | `shadow-integration` or `generational-healing` | Too vague and outcome-biased |
| `abundance` | `abundance-orientation` | Noun form less specific than orientation |
| `blocked` | `threshold-paralysis` or `creative-stagnation` | Too vague |
| `growth` | Avoid as a taxonomy term; use the specific growth direction | Too generic |
| `centre` | `center` | The COMPASS Method uses Center as the canonical pillar name |
| `observe` | `perceive` | The COMPASS Method uses Perceive as the canonical pillar name |
| `feel` | `sense` | The COMPASS Method uses Sense as the canonical pillar name |
| `close` | `seal` | The COMPASS Method uses Seal as the canonical pillar name |

---

## Canonical Terminology

These terms are fixed. Do not substitute alternatives.

- Use `seeker` not `querent`, `reader`, `client`, or `user`
- Use `pattern` not `theme" where describing a recurring behavioural loop
- Use `repeating` not `recurring` in all card-system-related language
- Use `life areas` not `categories`, `domains`, or `sections` when referring to the seven life-area sections
- Use `shadow expression` not `negative expression`, `difficult aspect`, or `dark side`
- Use `integrated expression` not `positive expression`, `healed aspect`, or `best case`
- Use `The COMPASS Method` when referring to the Tides of Knowing proprietary framework
- Use `Tides of Knowing` not `TOK`, `the site`, or `we` in schema and metadata contexts

---

## COMPASS Pillar Terms

The `compass_pillars` vocabulary uses the seven canonical pillars of The COMPASS Method.

| Public Pillar Name | Internal Taxonomy Term | Use When The Card Pattern Involves |
|-------------------|------------------------|------------------------------------|
| Center | `center` | Returning attention to stable ground before interpretation, reaction, or choice |
| Open | `open` | Softening fixed assumptions, emotional grip, projection, or premature certainty |
| Map | `map` | Locating the relationship between symbols, context, patterns, positions, and lived circumstances |
| Perceive | `perceive` | Noticing what is actually present beneath surface meaning, inherited scripts, or reactive interpretation |
| Align | `align` | Bringing insight, action, speech, or decision-making back into coherent relationship with truth |
| Sense | `sense` | Reading through felt intelligence, body knowing, subtle cues, emotional atmosphere, and intuitive signal |
| Seal | `seal` | Completing, integrating, containing, or closing the reading pattern so insight becomes usable |

Rules for `compass_pillars`:

1. Use only these seven terms: `center`, `open`, `map`, `perceive`, `align`, `sense`, `seal`
2. Do not create expanded forms such as `center-attention`, `open-awareness`, or `seal-integration`
3. Do not assign all seven pillars to any card
4. Most cards should carry 1-3 COMPASS pillar terms
5. Assign the pillar based on the interpretive function of the card, not the card's traditional tarot meaning
6. If a card shows a seeker caught in pressure, grip, projection, or urgency, consider `center` and `open`
7. If a card shows pattern recognition, symbolic relationship, or contextual meaning, consider `map` and `perceive`
8. If a card shows embodied knowing, intuitive signal, or emotional atmosphere, consider `sense`
9. If a card shows integration, completion, closure, or containment, consider `seal`
10. If a card shows decision, adjustment, coherence, or right action, consider `align`

---

## Assignment Philosophy

### Minimum / Maximum Assignments per Field

| Field | Minimum | Maximum | Notes |
|-------|---------|---------|-------|
| `themes` | 3 | 6 | Most cards: 3-5 |
| `life_areas` | 3 | 7 | Most minor arcana: 3-5; majors: up to 7 |
| `seeker_states` | 1 | 4 | Most cards: 2-3 |
| `compass_pillars` | 1 | 3 | Most cards: 2 |
| `archetypal_states` | 1 | 3 | Most cards: 1-2 |
| `relational_patterns` | 1 | 3 | Most cards: 1-2 |
| `shadow_patterns` | 1 | 3 | Most cards: 1-2 |
| `integration_paths` | 1 | 3 | Most cards: 1-2 |
| `emotional_patterns` | 2 | 5 | Most cards: 2-4 |
| `transitional_states` | 1 | 3 | Most cards: 1-2 |

### Assignment Accuracy

- Assign terms that genuinely describe the card's specific pattern, not terms that loosely apply to any card
- The most common error is assigning too many terms from each vocabulary (over-tagging)
- A card should only carry a term if a seeker filtering by that term would genuinely find the card relevant to their specific concern
- Prefer precision over completeness — it is better to assign 3 accurate terms than 7 imprecise ones

---

## Future Term Expansion Rules

To add a new term to any vocabulary:

1. The term must be absent from the current vocabulary (confirm before adding)
2. The term must be needed for at least 3 cards (single-card terms should not be added to the controlled vocabulary)
3. The term must meet all naming rules above
4. The term must have a clear written definition (2-3 sentences maximum)
5. The new term must be added to `controlled-vocabulary.md` before being assigned in `card-taxonomy-map.yaml`
6. After adding a new term, review all 78 cards to determine whether any previously assigned cards should also carry the new term

Human review required: The COMPASS pillar terms are now defined as `center`, `open`, `map`, `perceive`, `align`, `sense`, and `seal`. If the public naming of The COMPASS Method changes later, this document and `card-taxonomy-map.yaml` should be reviewed before any production taxonomy changes are made.

---

## Deprecated Term Handling

1. If a term is deprecated, it must be added to the Managed Synonyms table above with its replacement
2. All YAML files must be updated to remove deprecated terms and replace with canonical alternatives
3. Deprecated terms must not appear in production metadata, schema, or filtering systems
4. Add deprecated terms to a `deprecated` vocabulary section in `controlled-vocabulary.md` for historical reference

---

## Version Control

- The taxonomy is versioned alongside the card content files
- Any structural change to vocabulary (new vocabulary, renamed vocabulary, new term) requires a note in this document with the date
- Taxonomy assignments in `card-taxonomy-map.yaml` should be regenerated when vocabulary changes substantially

---

## AI Retrieval Guidance

Taxonomy terms serve multiple functions in AI retrieval contexts:

1. **Vector search labels**: Terms should be semantically close to the natural language a seeker would use. `threshold-paralysis` is closer to "I can't make myself start" than `ambivalence` is.
2. **Filter facets**: Terms enable faceted filtering on the live site. Keep the total number of terms in each vocabulary manageable (under 50 per vocabulary, preferably under 30).
3. **Semantic clustering**: Related terms should cluster together in vector space. Group terms by psychological domain when possible.
4. **Entity signals**: Repeated use of taxonomy terms across multiple cards reinforces semantic entity signals for AI systems. The most frequently assigned terms (those appearing across 20+ cards) become strong entity signals for the TOK brand.

---

## Tagging Priority Order

When assigning tags to a card, prioritise in this order:

1. Core pattern theme (the central psychological dynamic the card marks)
2. Primary seeker state (what the seeker is doing or experiencing)
3. Primary shadow pattern (specific shadow expression named in the card content)
4. Primary integration path (what the integrated expression describes)
5. Emotional pattern (the felt quality of the pattern)
6. Transitional state (the threshold or transition involved)7. COMPASS pillar (the interpretive condition the card most strongly activates)
8. Supplementary themes (secondary but genuine aspects of the card)
9. Life areas (all genuinely relevant life areas; do not artificially limit these)

---

## Relationship to Other Layers

- Taxonomy terms flow into: metadata keywords, schema keywords, internal linking clusters, AI retrieval labels
- Taxonomy terms do NOT flow into: card source markdown, visible page content, user-facing labels (unless filtered)
- The human-facing filter labels on the live site may differ from the internal taxonomy terms (e.g., `threshold-paralysis` as internal term might display as "Stuck at a threshold" in a seeker-facing filter)
- COMPASS pillar terms may appear in user-facing contexts only when framed through The COMPASS Method, not as generic filter labels
- Human review required: Decide whether taxonomy terms appear as-is in filter UI or are translated into seeker-friendly language