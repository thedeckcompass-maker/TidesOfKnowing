# Relationship Logic
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 3 — Related Cards

---

## Purpose

This document defines the logic rules used to determine which cards are listed as related cards for each of the 78 repeating card meaning pages. Related cards serve three functions:

1. **Internal linking** — each related card becomes a link from the current card's page to another card's page, building topical authority and crawlable link structure
2. **Seeker navigation** — related cards guide a seeker from their current card to adjacent patterns they may recognise or need
3. **AI retrieval clustering** — related card relationships signal semantic proximity to AI retrieval systems, reinforcing topical clusters

---

## Relationship Types

Six relationship types are used. Each card entry in `related-card-map.yaml` lists 3-5 cards, with each relationship explicitly typed.

| Type Code | Relationship Name | Definition |
|-----------|------------------|-----------|
| `same-theme` | Shares Core Theme | Both cards repeat around the same primary psychological pattern |
| `progressive` | Progressive Pattern | One card represents an earlier or later stage of the same developmental arc |
| `shadow-pair` | Shadow Pair | One card represents the shadow expression of the same territory the other card integrates |
| `suit-companion` | Suit Companion | Cards from the same suit that address adjacent territory within that suit's domain |
| `archetypal-mirror` | Archetypal Mirror | Cards that share a dominant archetypal state and activate similar seeker positions |
| `resolving-pair` | Resolving Pair | The related card represents a genuine resolution pathway or integration of the current card's pattern |

---

## Assignment Rules

### Quantity
- Minimum: 3 related cards per card
- Maximum: 5 related cards per card
- Most cards carry 4 related cards

### Type Distribution
- Every card should carry at least 2 different relationship types
- Do not list more than 3 cards of any single relationship type for one card
- A card listed as `resolving-pair` should be the card most likely to answer "what does resolution look like?"

### Cross-Suit Relationships
- Major Arcana cards may relate to cards from any suit or other majors
- Minor Arcana cards should have at least 1 cross-suit or cross-arcana relationship
- Court cards have higher affinity with other court cards sharing their element (e.g., King of Cups and Queen of Cups)

### Bidirectionality
- Most relationships are bidirectional (if A relates to B, B relates to A)
- Some relationships are directional (a `progressive` relationship may only flow one way on one of the cards)
- Directional relationships are noted in the YAML with a `direction` flag

### Avoiding Over-Connection
- Do not list a card as related to more than 6 other cards across the full map (prevents hub cards that dilute link value)
- The most commonly referenced cards will naturally have higher internal link authority; this is intentional

---

## Priority Logic for Selecting Related Cards

When selecting which 3-5 cards to list, use this priority order:

1. Cards that share the exact same primary `themes` term
2. Cards that share the same primary `seeker_states` term and describe adjacent territory
3. Cards from the same suit at adjacent numbers (strong contextual proximity)
4. Cards that share the same primary `integration_paths` term (resolution corridor)
5. Cards that represent the shadow/integrated pair (explicit psychological complement)
6. Major Arcana cards that govern the same psychological territory as the minor card

---

## Terminology Note

The `relationship_type` field in `related-card-map.yaml` uses the type codes above (`same-theme`, `progressive`, `shadow-pair`, `suit-companion`, `archetypal-mirror`, `resolving-pair`).

Related card slugs use the canonical collection ID format: `majors/the-fool`, `cups/ace-of-cups`, etc.

---

## Suit Progression Logic

Within each suit, the numbered cards follow a developmental arc. The following sequence represents the psychological arc for each suit:

### Wands Arc (Creative/Purposive Energy)
Ace (impulse) → 2 (choice at threshold) → 3 (early expansion) → 4 (arrival/celebration) → 5 (conflict/friction) → 6 (recognition) → 7 (defence) → 8 (rapid movement) → 9 (exhaustion/endurance) → 10 (overload) → Page (learner) → Knight (pursuer) → Queen (mature creative authority) → King (mastery)

### Cups Arc (Emotional/Relational Energy)
Ace (emotional opening) → 2 (partnership threshold) → 3 (community/joy) → 4 (withdrawal) → 5 (grief/loss) → 6 (nostalgia/past) → 7 (fantasy/choice paralysis) → 8 (walking away) → 9 (satisfaction/wish) → 10 (belonging/fulfilment) → Page (emotional beginner) → Knight (romantic pursuit) → Queen (mature emotional care) → King (emotional authority)

### Swords Arc (Mental/Communicative Energy)
Ace (clarity/new truth) → 2 (stalemate) → 3 (heartbreak) → 4 (rest/recovery) → 5 (conflict/loss) → 6 (transition/departure) → 7 (strategy/evasion) → 8 (entrapment) → 9 (anxiety/rumination) → 10 (ending/surrender) → Page (curious mind) → Knight (rapid thought/action) → Queen (clear-sighted authority) → King (intellectual mastery)

### Pentacles Arc (Material/Practical Energy)
Ace (practical beginning) → 2 (juggling/balance) → 3 (collaboration/craft) → 4 (holding/control) → 5 (lack/exclusion) → 6 (giving/receiving) → 7 (patience/assessment) → 8 (practice/skill) → 9 (self-sufficiency) → 10 (legacy/family) → Page (practical learner) → Knight (methodical progress) → Queen (embodied care) → King (material authority)

---

## Major Arcana Thematic Groupings

For relationship purposes, the Major Arcana are grouped into the following thematic clusters:

| Cluster | Cards | Primary Territory |
|---------|-------|------------------|
| Initiation | The Fool, The Magician, The High Priestess | Beginning, potential, hidden knowing |
| Structure | The Emperor, The Hierophant, Justice | Authority, inheritance, systems |
| Love and Choice | The Empress, The Lovers, The Star | Relationship, value, renewal |
| Journey and Will | The Chariot, Strength, The Hermit | Self-mastery, endurance, withdrawal |
| Fate and Cycle | Wheel of Fortune, The Hanged Man, Death | Change, surrender, endings |
| Transformation | Temperance, The Devil, The Tower | Integration, grip, disruption |
| Completion | The Moon, The Sun, Judgement, The World | Awakening, clarity, wholeness |

---

## Notes for Implementation

- Related card links on the live site should display card name + brief pattern descriptor, not just card name
- Human review required: Confirm whether related cards display as a sidebar component, inline links, or a bottom-of-page grid
- The `related-card-map.yaml` provides the semantic relationships; visual presentation is a front-end implementation decision
