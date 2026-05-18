# Topic Cluster Map
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 6 — Internal Linking

---

## Purpose

This document defines the linking strategy for each topic cluster, specifying which cards form the dense linking core, how cards within a cluster should link to each other, and how each cluster connects to its pillar page candidate. It is the implementation companion to `high-authority-clusters.md` (which defines the clusters) and `internal-linking-map.yaml` (which records per-card cluster memberships).

---

## Linking Architecture Overview

The internal linking system operates at three levels:

1. **Card-to-card links** (3-5 per card) — defined in `related-card-map.yaml`. These are the direct, contextual links embedded within each card's page content.
2. **Cluster links** — cards within the same cluster link to the cluster's pillar page. The pillar page links back to every card in its cluster.
3. **Hub card links** — the 10 cross-cluster hub cards receive links from cards in all clusters they belong to. They are prioritised in internal link distribution.

---

## Pillar Page Link Structure

Each pillar page serves as a collection hub. All cards in a cluster should:
- Include at least one in-content link to the cluster's pillar page
- Be linked to from the pillar page's card listing
- Use cluster-appropriate anchor text (see per-cluster guidance below)

Human review required: Confirm whether pillar pages exist or will be built. Until pillar pages are live, the cluster linking strategy applies only to card-to-card links via related-card-map.yaml.

---

## Cluster 1 — Threshold and Beginning

**Pillar page**: "When Tarot Keeps Showing You a Beginning Card"
**Pillar page URL**: `/repeating-card-meanings/beginning-cards` (proposed)

**Cards** (11):
The Fool, Ace of Cups, Ace of Wands, Ace of Pentacles, Ace of Swords, Two of Wands, The Lovers, The Chariot, Page of Cups, Page of Wands, Page of Pentacles

**Dense core** (highest internal link priority within cluster):
- All four Aces link to each other as archetypal-mirror pairs
- The Fool links to all four Aces
- All three Pages link to each other

**Linking guidance**:
- Ace cards use "when you keep drawing a new beginning card" as cluster anchor text
- Page cards use "when you keep drawing a learner or beginner card" as cluster anchor text
- The Fool is the highest-authority card in this cluster; it should receive links from all Ace and Page pages

**Incoming links from other clusters**:
- Cluster 10 (Identity): The Fool, The Magician
- Cluster 9 (Transition): Four of Wands (arrival after transition loops back to beginning)

---

## Cluster 2 — Grief and Ending

**Pillar page**: "When Tarot Keeps Showing You a Loss or Ending Card"
**Pillar page URL**: `/repeating-card-meanings/loss-ending-cards` (proposed)

**Cards** (10):
Five of Cups, Eight of Cups, Three of Swords, Ten of Swords, Six of Swords, Death, The Tower, The Hanged Man, Judgement, Six of Cups

**Dense core**:
Five of Cups, Eight of Cups, Three of Swords, Ten of Swords, Death

**Secondary hubs**:
Six of Swords, The Tower

**Linking guidance**:
- Five of Cups and Eight of Cups form a progressive pair — each should explicitly link to the other
- Death links to both The Hanged Man (progressive: suspension before death) and The Tower (same-theme: forced ending)
- Six of Swords should link to Eight of Cups (both involve physical/emotional departure)
- Judgement links to Death (progressive: awakening after ending) and to Six of Cups (grief into past review)
- Six of Cups receives links from Five of Cups and Eight of Cups (shared grief territory)

**Incoming links from other clusters**:
- Cluster 9 (Transition): Death, The Hanged Man, The Tower, Six of Swords, Eight of Cups
- Cluster 4 (Patterns): Six of Cups
- Cluster 11 (Emotional): Five of Cups

---

## Cluster 3 — Authority and Power

**Pillar page**: "When Tarot Keeps Showing You a Power or Authority Card"
**Pillar page URL**: `/repeating-card-meanings/authority-power-cards` (proposed)

**Cards** (14):
The Emperor, The Hierophant, The Chariot, Strength, Justice, The Sun, Six of Wands, Seven of Wands, King of Wands, King of Cups, King of Swords, King of Pentacles, Queen of Wands, Queen of Swords

**Dense core**:
All four Kings link to each other and to The Emperor

**Secondary hubs**:
Strength (links to all Kings and to The Hermit), Six of Wands and Seven of Wands (progression pair)

**Linking guidance**:
- All Kings should link to The Emperor as the archetypal authority card
- Six of Wands and Seven of Wands are a natural progression pair: recognition followed by defence
- Strength should link to all uninhabited-authority cards (Kings, Queen of Wands, Six of Wands)
- The Sun links to Strength and to Six of Wands (visibility territory)
- Queen of Wands links to Queen of Swords (parallel authority expressions across element)

**Incoming links from other clusters**:
- Cluster 4 (Patterns): The Emperor, The Hierophant
- Cluster 8 (Material): The Emperor, The Hierophant, King of Pentacles
- Cluster 5 (Shadow): Strength
- Cluster 10 (Identity): Strength, The Sun, Queen of Wands, Queen of Swords

---

## Cluster 4 — Patterns and Inheritance

**Pillar page**: "When Tarot Keeps Showing You Family or Generational Patterns"
**Pillar page URL**: `/repeating-card-meanings/generational-pattern-cards` (proposed)

**Cards** (9):
The Hierophant, The Emperor, Six of Cups, Ten of Pentacles, Four of Pentacles, The Moon, Wheel of Fortune, King of Pentacles, Ten of Cups

**Dense core**:
The Hierophant, Ten of Pentacles, Six of Cups

**Linking guidance**:
- Ten of Pentacles should link to The Emperor, The Hierophant, and Four of Pentacles (material inheritance chain)
- Six of Cups links to Ten of Cups (nostalgia vs. fulfilment — progressive relationship)
- The Moon links to The Hierophant (inherited unconscious patterns vs. inherited institutional patterns)
- Four of Pentacles links to Ten of Pentacles (accumulation before legacy)
- King of Pentacles is the stewardship card for Ten of Pentacles

**Incoming links from other clusters**:
- Cluster 2 (Grief): Six of Cups
- Cluster 7 (Relationships): Six of Cups, Ten of Cups, Four of Pentacles
- Cluster 8 (Material): Four of Pentacles, Ten of Pentacles, King of Pentacles
- Cluster 5 (Shadow): The Moon

---

## Cluster 5 — Shadow and Projection

**Pillar page**: "When Tarot Keeps Showing You Shadow or Hidden-Truth Cards"
**Pillar page URL**: `/repeating-card-meanings/shadow-projection-cards` (proposed)

**Cards** (9):
The Moon, The Devil, The High Priestess, The Hermit, Strength, Seven of Swords, Eight of Swords, Nine of Swords, Five of Swords

**Dense core** (anxiety/cognitive sub-cluster):
The Moon, The Devil, Eight of Swords, Nine of Swords

**Linking guidance**:
- The Moon links to The High Priestess (both involve hidden knowing and unconscious territory)
- Eight of Swords and Nine of Swords form a progression pair — cognitive entrapment to anxiety/rumination
- Seven of Swords links to Five of Swords (strategic avoidance vs. open conflict — related shadow expressions)
- Strength links to The Moon (shadow reclamation vs. shadow projection)
- The Hermit links to The Moon and to The High Priestess (solitude as integration vs. isolation as shadow)

**Incoming links from other clusters**:
- Cluster 3 (Authority): Strength
- Cluster 10 (Identity): Strength, The Hermit
- Cluster 6 (Practice): The Hermit
- Cluster 11 (Emotional): Eight of Swords, Nine of Swords, The Moon, The Devil

---

## Cluster 6 — Practice and Mastery

**Pillar page**: "When Tarot Keeps Showing You a Practice or Craft Card"
**Pillar page URL**: `/repeating-card-meanings/practice-mastery-cards` (proposed)

**Cards** (9):
Eight of Pentacles, Three of Pentacles, Seven of Pentacles, Knight of Pentacles, The Hermit, Page of Pentacles, Eight of Wands, Four of Cups, Ten of Wands

**Dense core**:
Eight of Pentacles, Three of Pentacles, Seven of Pentacles

**Linking guidance**:
- Eight of Pentacles, Seven of Pentacles, and Three of Pentacles form the practice core — all should link to each other
- Knight of Pentacles links to Eight of Pentacles (method) and Seven of Pentacles (patience)
- Page of Pentacles links to Eight of Pentacles (beginning of the practice arc)
- Ten of Wands links to Eight of Pentacles and Knight of Pentacles (over-commitment vs. sustainable effort)
- Four of Cups links to Eight of Pentacles (withdrawal from practice vs. engaged practice)
- The Hermit links to all Pentacles practice cards as the discipline card

**Incoming links from other clusters**:
- Cluster 1 (Threshold): Page of Pentacles
- Cluster 8 (Material): Eight of Pentacles, Seven of Pentacles, Three of Pentacles
- Cluster 11 (Emotional): Four of Cups, Ten of Wands

---

## Cluster 7 — Relationships and Reciprocity

**Pillar page**: "When Tarot Keeps Showing You a Love or Relationship Card"
**Pillar page URL**: `/repeating-card-meanings/relationship-cards` (proposed)

**Cards** (11):
Two of Cups, Three of Cups, Six of Pentacles, The Empress, The Lovers, Ten of Cups, Queen of Cups, King of Cups, Six of Cups, Four of Pentacles, Knight of Cups

**High-traffic hubs** (highest search volume in this cluster):
Two of Cups, The Lovers, Ten of Cups, Six of Pentacles

**Linking guidance**:
- Two of Cups links to The Lovers (threshold vs. committed choice in relationship)
- Ten of Cups links to Two of Cups and Three of Cups (individual bond to family belonging arc)
- The Empress links to Queen of Cups (relational care territory) and to Six of Pentacles (material care)
- Six of Pentacles links to Four of Pentacles (generosity vs. withholding — shadow pair)
- Knight of Cups links to Two of Cups and to The Lovers (idealism before commitment)
- Six of Cups links to Ten of Cups and to Two of Cups (past relational patterns vs. present belonging)

**Incoming links from other clusters**:
- Cluster 1 (Threshold): The Lovers
- Cluster 4 (Patterns): Six of Cups, Ten of Cups, Four of Pentacles
- Cluster 8 (Material): Six of Pentacles, Four of Pentacles
- Cluster 3 (Authority): King of Cups

---

## Cluster 8 — Material Security and Abundance

**Pillar page**: "When Tarot Keeps Showing You a Money or Stability Card"
**Pillar page URL**: `/repeating-card-meanings/money-stability-cards` (proposed)

**Cards** (11):
Ace of Pentacles, Four of Pentacles, Five of Pentacles, Six of Pentacles, Seven of Pentacles, Eight of Pentacles, Nine of Pentacles, Ten of Pentacles, King of Pentacles, The Emperor, The Hierophant

**Natural sub-cluster**:
All ten Pentacles (Ace through King) form a natural suit cluster within this theme cluster

**Linking guidance**:
- The Pentacles suit sequence follows the material arc — adjacent numbered cards naturally link
- Four of Pentacles and Five of Pentacles form a shadow pair (accumulation and fear of lack)
- Nine of Pentacles links to Ten of Pentacles (self-sufficiency to legacy)
- The Emperor and The Hierophant link to King of Pentacles (institutional and paternal authority over material)
- Eight of Pentacles links to Nine of Pentacles (practice to earned sufficiency)

**Incoming links from other clusters**:
- Cluster 4 (Patterns): Four of Pentacles, Ten of Pentacles, King of Pentacles
- Cluster 6 (Practice): Eight of Pentacles, Seven of Pentacles
- Cluster 7 (Relationships): Six of Pentacles, Four of Pentacles
- Cluster 3 (Authority): The Emperor, The Hierophant, King of Pentacles

---

## Cluster 9 — Transition and Change

**Pillar page**: "When Tarot Keeps Showing You Change and Transition Cards"
**Pillar page URL**: `/repeating-card-meanings/transition-change-cards` (proposed)

**Cards** (10):
Death, The Tower, Wheel of Fortune, The Hanged Man, Six of Swords, Eight of Cups, Four of Wands, Three of Wands, Judgement, The World

**Core transition cluster**:
Death, The Tower, The Hanged Man, Six of Swords

**Linking guidance**:
- Death links to The Hanged Man (suspension before death) and to Judgement (death into awakening)
- The Tower links to Death (related forced endings — same-theme) and to Wheel of Fortune (structural disruption vs. cyclical change)
- Six of Swords links to Eight of Cups (both involve chosen departure)
- Three of Wands and Four of Wands form a progression: early expansion arriving at celebration
- The World links to Death and to Judgement (completion of the major transition arc)
- Wheel of Fortune links to Death (cyclical change) and to The Tower (disruption vs. cycle)

**Incoming links from other clusters**:
- Cluster 2 (Grief): Death, The Hanged Man, The Tower, Six of Swords, Eight of Cups
- Cluster 10 (Identity): The World, Judgement
- Cluster 4 (Patterns): Wheel of Fortune

---

## Cluster 10 — Identity and Self-Worth

**Pillar page**: "When Tarot Keeps Showing You Identity or Self-Worth Cards"
**Pillar page URL**: `/repeating-card-meanings/identity-self-worth-cards` (proposed)

**Cards** (11):
The Fool, The Magician, The Sun, The World, Judgement, Strength, Six of Wands, Nine of Cups, The Hermit, Queen of Wands, Queen of Swords

**Major arcana identity arc** (dense core):
The Fool, The Sun, Judgement, The World — all four link to each other

**Linking guidance**:
- The Fool links to The Magician (threshold to claimed power — progressive)
- The Sun links to Judgement (radiant identity to awakened self)
- Strength links to The Sun and to The Fool (shadow integration to visibility)
- Nine of Cups links to The Sun (self-satisfied contentment as identity territory)
- Queen of Wands links to Queen of Swords (parallel identity expressions, cross-element)
- The Hermit links to The Magician and to Strength (solitary depth as identity work)

**Incoming links from other clusters**:
- Cluster 1 (Threshold): The Fool
- Cluster 3 (Authority): Strength, The Sun, Queen of Wands, Queen of Swords
- Cluster 5 (Shadow): Strength, The Hermit
- Cluster 9 (Transition): Judgement, The World

---

## Cluster 11 — Emotional Patterns

**Pillar page**: "When Tarot Keeps Showing You Emotional Pattern Cards"
**Pillar page URL**: `/repeating-card-meanings/emotional-pattern-cards` (proposed)

**Cards** (10):
Nine of Swords, Eight of Swords, The Moon, Four of Cups, Five of Cups, Temperance, The Devil, King of Cups, Queen of Cups, Ten of Wands

**Anxiety/cognitive sub-cluster**:
Nine of Swords, Eight of Swords, The Moon

**Withdrawal sub-cluster**:
Five of Cups, Four of Cups

**Linking guidance**:
- Nine of Swords and Eight of Swords link to each other as cognitive entrapment → anxiety progression
- The Moon links to both Nine of Swords and Eight of Swords (unconscious projection feeding anxiety)
- The Devil links to The Moon (entrapment from projection vs. grip from habit)
- Five of Cups links to Four of Cups (grief → emotional withdrawal arc)
- Temperance links to all emotional imbalance cards as the integration destination
- Ten of Wands links to Temperance (overload seeking balance)
- King of Cups and Queen of Cups link to each other and to Temperance (emotional authority and its shadow)

**Incoming links from other clusters**:
- Cluster 2 (Grief): Five of Cups
- Cluster 5 (Shadow): Nine of Swords, Eight of Swords, The Moon, The Devil
- Cluster 3 (Authority): King of Cups
- Cluster 6 (Practice): Four of Cups, Ten of Wands
- Cluster 7 (Relationships): Queen of Cups, King of Cups

---

## Cross-Cluster Hub Linking Rules

The 10 hub cards (The Empress, The Emperor, The Hierophant, Strength, The Hermit, Death, The Devil, The Moon, Ten of Pentacles, and the Hermit) operate across cluster boundaries. Rules for hub card linking:

1. Hub cards receive in-text links from cards in all clusters they belong to
2. Hub cards should link out to at least one card from each cluster they belong to
3. When a non-hub card belongs to a cluster that includes a hub, the non-hub card should link to the hub
4. Hub cards should not be over-linked — the cap of 6 incoming references from related-card-map.yaml applies

**Hub link priority**:
| Hub Card | Priority Incoming Links From |
|----------|------------------------------|
| The Moon | Cluster 5 (shadow), Cluster 11 (emotional), Cluster 4 (patterns) |
| The Hermit | Cluster 5 (shadow), Cluster 6 (practice), Cluster 10 (identity) |
| Death | Cluster 2 (grief), Cluster 9 (transition) |
| Strength | Cluster 3 (authority), Cluster 5 (shadow), Cluster 10 (identity) |
| The Emperor | Cluster 3 (authority), Cluster 4 (patterns), Cluster 8 (material) |
| The Hierophant | Cluster 3 (authority), Cluster 4 (patterns), Cluster 8 (material) |
| The Devil | Cluster 5 (shadow), Cluster 11 (emotional) |
| The Empress | Cluster 7 (relationships), Cluster 8 (material) |
| Ten of Pentacles | Cluster 4 (patterns), Cluster 8 (material) |

---

## Internal Link Quota Guidelines

To prevent dilution of link equity and maintain editorial integrity:

- **Maximum outbound links per card page**: 8 (includes 3-5 related card links + up to 3 pillar page links)
- **Minimum outbound links per card page**: 3 (the minimum related card count from related-card-map.yaml)
- **Hub cards**: May appear as link targets more than standard cards, but should not dominate any single page
- **Tier-4 cards** (no cluster): Link only through related-card-map.yaml relationships until cluster assignment is confirmed

Human review required: Confirm maximum link count with CMS/template constraints. Some SSG configurations limit sidebar or related-card component slots.

---

## Pillar Page Priority for Launch

Based on search volume territory, build pillar pages in this order:

| Priority | Cluster | Pillar Page Title | Rationale |
|----------|---------|------------------|-----------|
| 1 | 7 | Relationships and Reciprocity | Highest search volume territory in tarot |
| 2 | 2 | Grief and Ending | Second-highest emotional search volume |
| 3 | 8 | Material Security and Abundance | High-frequency practical queries |
| 4 | 1 | Threshold and Beginning | Broad catch-all for first-time seekers |
| 5 | 9 | Transition and Change | Common life event searches |
| 6 | 3 | Authority and Power | Strong career/purpose query match |
| 7 | 11 | Emotional Patterns | Psychological search territory |
| 8 | 10 | Identity and Self-Worth | Growing self-development search category |
| 9 | 5 | Shadow and Projection | Niche but high-quality seeker intent |
| 10 | 6 | Practice and Mastery | Lower volume, high engagement |
| 11 | 4 | Patterns and Inheritance | Most niche; specialist audience |
