# Tides of Knowing Prompt Library

Editable prompt files that supplement the supreme editorial governor and weekly generator rules.

Leigh can update these files over time. Cursor must load relevant files before generating a weekly pack.

---

## Campaign Focus / Notes weighting

**Campaign Focus / Notes are the highest-weight run-specific input beneath the supreme editorial governor.**

They are used to decide:

* campaign mode
* content treatment
* CTA tone
* audience assumption level
* sequencing
* training invitation count and timing

If Leigh supplies notes, Cursor must translate them into operational instructions before generating any assets. Notes override default pack behaviour unless they conflict with factual accuracy, the source page, the supreme governor, or legal, ethical or brand safety rules.

See `TOK_WEEKLY_SOCIAL_PACK_GENERATOR_RULES.md` section **Campaign Focus Weighting Law**.

---

## Load order

1. `TOK_EDITORIAL_VOICE_AND_GENERATION_GOVERNOR.md` (supreme authority)
2. `TOK_WEEKLY_SOCIAL_PACK_GENERATOR_RULES.md` (operational rules, including Campaign Focus Weighting Law)
3. **Campaign Focus Interpretation** from supplied notes (if any)
4. Relevant files from this library based on content type, pack type, campaign mode, platform and notes
5. Source card and angle bank if available

**Conflict rule:** If campaign mode conflicts with default pack structure, campaign mode wins.

**Campaign Focus / Notes from the builder are governing inputs,** not metadata-only notes.

---

## Folder map

| Folder | Purpose |
| :--- | :--- |
| `content-types/` | Rules by source content type (About, Article, Field Note, Tool, Repeating Card Page) |
| `pack-types/` | Rules by weekly pack shape (Full Article, About Introduction, Training Invitation) |
| `campaign-modes/` | Rules by campaign intent (First Introduction, Standard, Evergreen Catch-Up) |
| `platforms/` | Rules by platform and asset shape (X single, thread, Facebook, Instagram, Pinterest, Substack) |
| `feedback/` | Campaign focus log and pack audit feedback for continuous improvement |

---

## Automatic load triggers

| Trigger | Load these files |
| :--- | :--- |
| URL path `/about/` or content type About Page | `content-types/about-page.md`, `pack-types/about-introduction-pack.md` |
| Campaign notes mention first social posting, first posts, introduction, introducing me, new audience, start here, about page, reintroduction, first launch, starting social media | `campaign-modes/first-social-introduction-week.md` (plus about-page files when URL is `/about/` or content type is About Page) |
| Source mode: First Social Introduction Pack | `campaign-modes/first-social-introduction-week.md`, `pack-types/about-introduction-pack.md` |
| Standard article or Field Note | `content-types/article.md` or `content-types/field-note.md`, `pack-types/full-article-field-note-pack.md`, `campaign-modes/standard-week.md` |
| Evergreen catch-up | `campaign-modes/evergreen-catch-up-week.md` |
| Training invitation pack | `pack-types/training-invitation-pack.md` |

Load the matching platform file for each asset as it is generated.

---

*Created: 2026-06-05*
