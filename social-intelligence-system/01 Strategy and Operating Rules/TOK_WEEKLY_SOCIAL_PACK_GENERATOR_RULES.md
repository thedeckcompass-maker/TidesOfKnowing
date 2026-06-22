# Tides of Knowing Weekly Social Pack Generator Rules

**Operational companion to:** `TOK_EDITORIAL_VOICE_AND_GENERATION_GOVERNOR.md`

If these rules conflict with the editorial governor, the governor takes precedence.

## Governing Principle

Generate the week, review and approve copy, set image instructions, then export one Executive Assistant handoff HTML.

The normal workflow is browser-first:

1. Generate a weekly pack.
2. Leigh opens `START_HERE_FOR_POSTING.html`.
3. Leigh reviews and approves copy.
4. Leigh sets a plain `Image to use` instruction.
5. Leigh clicks `Export Executive Assistant Posting Handoff`.
6. One portable HTML file downloads: `EXECUTIVE_ASSISTANT_POSTING_HANDOFF.html`.
7. If supplied images are needed, they travel in `Executive Assistant Handoff/images/`.

`START_HERE_FOR_POSTING.html` is the main human interface for the week. Markdown files are supporting records only.

## Required Inputs

Every generation run requires:

1. Source URL
2. Posting week, Monday start date to Sunday end date
3. Content type
4. Source ID, such as TOK-0001
5. Source title

Optional inputs:

1. Source card file, if available
2. Angle bank file, if available
3. Campaign Focus / Notes from the Weekly Pack Builder
4. The Deck Compass training URL

## Prompt Library

Before generating a pack, load relevant files from:

`01 Strategy and Operating Rules/Prompt Library/`

Prompt Library files supplement the editorial governor and these rules. They do not replace the governor.

### Load Order

1. `TOK_EDITORIAL_VOICE_AND_GENERATION_GOVERNOR.md`
2. `TOK_WEEKLY_SOCIAL_PACK_GENERATOR_RULES.md`
3. Relevant Prompt Library files
4. Matching platform prompt file for each asset
5. Source card and angle bank if available

### Platform Prompt Files

Load the matching platform file for each asset as it is generated:

1. X single posts: `platforms/x-twitter-single.md`
2. X threads: `platforms/x-twitter-thread.md`
3. Facebook posts: `platforms/facebook-reflective.md`
4. Instagram carousels: `platforms/instagram-carousel.md`
5. Instagram quote, concept, or soft training visuals: `platforms/instagram-quote-concept.md`
6. Pinterest pins: `platforms/pinterest-pin.md`
7. Substack notes: `platforms/substack-note.md`

## Campaign Focus Rules

Campaign Focus / Notes are a high-weight governing input for the specific generation run.

If supplied, convert the notes into operational instructions before generating assets. They must affect:

1. campaign mode selection
2. pack type and asset count
3. angle priority and sequencing
4. CTA tone and stage
5. audience assumption level
6. training invitation count and timing
7. first-line orientation rules per platform

Before generation, create a short Campaign Focus Interpretation with:

1. exact notes received
2. what the notes require
3. Prompt Library files triggered
4. default behaviours overridden
5. risks or ambiguities

After generation, audit every asset against the notes. If more than 20 percent of assets are Weak against Campaign Focus / Notes, mark the pack `Needs Regeneration`.

## First-Introduction Trigger Rule

If Campaign Focus / Notes include first social posting, first posts, introduction, introducing me, new audience, start here, about page, reintroduction, first launch, or starting social media, load and apply:

1. `Prompt Library/campaign-modes/first-social-introduction-week.md`
2. `Prompt Library/pack-types/about-introduction-pack.md`
3. `Prompt Library/content-types/about-page.md` when the source is the About page

For first social introduction packs, training invitations must be deferred unless campaign instructions explicitly allow one soft late-week invitation.

## Generation Workflow

1. Read Campaign Focus / Notes.
2. Create Campaign Focus Interpretation if notes are supplied.
3. Resolve Source ID, Source title, and Source URL.
4. Load relevant Prompt Library and platform prompt files.
5. Determine pack size and schedule.
6. Generate platform-adapted assets.
7. Create `START_HERE_FOR_POSTING.html`.
8. Create `EXECUTIVE_ASSISTANT_POSTING_INSTRUCTIONS.md`.
9. Create asset Markdown files as supporting records.
10. Create an optional `images/` folder only when useful for supplied images.
11. Audit campaign focus and platform compliance.
12. Report files created and any items that need Leigh review.

Do not require extra scheduler files, image tracking files, compressed packages, or automatic delivery copying for the normal workflow.

## Required Future Asset Fields

Future asset records should use simple fields:

1. Source ID
2. Source title
3. Source URL
4. Platform
5. Posting date
6. Scheduled time
7. Asset type
8. Status
9. Asset headline
10. Business objective
11. CTA type
12. Post copy
13. CTA
14. Image to use
15. Supplied image filename, only if applicable
16. Image brief for designer, only if applicable
17. Posting instructions for Executive Assistant
18. Notes

Do not require old visual fields.

## Image to Use Model

Use one plain field:

`Image to use`

Allowed states:

1. `No separate image needed`
2. `Use source page image`
3. `Use supplied image from handoff folder`
4. `Image still needed`

For `Use supplied image from handoff folder`, include `Supplied image filename` only when applicable. The exported Executive Assistant handoff must refer to supplied files as `images/[filename]`.

For `Image still needed`, include `Image brief for designer` only when useful. Image briefs are supporting instructions, not a required separate file.

Do not generate image files.

## Fixed Weekly Pack Schedules

### Article or Field Note URL

Default total: 14 source-led assets plus 3 The Deck Compass training invitation assets.

Source-led assets:

| # | Day | Platform | Asset type | Default time |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Monday | X / Twitter | Thesis post | 9:00 a.m. |
| 2 | Monday | Facebook | Reflective post | 12:30 p.m. |
| 3 | Tuesday | X / Twitter | Insight post | 10:30 a.m. |
| 4 | Tuesday | Instagram | Carousel | 1:30 p.m. |
| 5 | Wednesday | X / Twitter | Question-led post | 9:00 a.m. |
| 6 | Wednesday | Pinterest | Pin | 8:30 p.m. |
| 7 | Thursday | X / Twitter | Method post | 10:30 a.m. |
| 8 | Thursday | Facebook | Practical post | 12:30 p.m. |
| 9 | Friday | X / Twitter | Short thread | 9:00 a.m. |
| 10 | Friday | Instagram | Quote or concept post | 6:30 p.m. |
| 11 | Saturday | Substack | Note | 9:30 a.m. |
| 12 | Saturday | Pinterest | Second pin or search variation | 8:30 p.m. |
| 13 | Sunday | X / Twitter | Reflective post | 9:00 a.m. |
| 14 | Sunday | Facebook | Conversation post | 7:30 p.m. |

### The Deck Compass Training Invitation Assets

Generated when the pack type or campaign notes call for them. If The Deck Compass training URL is supplied, use it as the CTA destination. If blank, use the source URL as the bridge destination.

Week A:

1. Tuesday: Facebook, 7:30 p.m.
2. Thursday: X / Twitter, 10:30 a.m.
3. Sunday: Instagram, 6:30 p.m.

Week B:

1. Monday: X / Twitter, 10:30 a.m.
2. Wednesday: Facebook, 7:30 p.m.
3. Friday: Instagram, 6:30 p.m.

Week C:

1. Tuesday: Instagram, 1:30 p.m.
2. Friday: Facebook, 12:30 p.m.
3. Saturday: X / Twitter, 9:00 a.m.

Week D:

1. Monday: Facebook, 12:30 p.m.
2. Thursday: Instagram, 6:30 p.m.
3. Sunday: X / Twitter, 9:00 a.m.

## Weekly Folder Structure

Normal future pack folder:

`START_HERE_FOR_POSTING.html`

`EXECUTIVE_ASSISTANT_POSTING_INSTRUCTIONS.md`

asset Markdown files as supporting records

optional `images/` folder only when useful

Do not list old scheduler, image tracking, or separate image brief files as required.

## START_HERE_FOR_POSTING.html Requirements

The review page must support the stable simplified workflow:

1. Review and edit copy if needed.
2. Approve Copy or Approve All Copy.
3. Set `Image to use`.
4. Click `Export Executive Assistant Posting Handoff`.
5. Download one portable HTML file named `EXECUTIVE_ASSISTANT_POSTING_HANDOFF.html`.

Main visible controls near the dashboard should be:

1. `Approve All Copy`
2. `Clear All Approvals`
3. `Export Executive Assistant Posting Handoff`

The exported handoff must be standalone, browser-openable, and portable. It must not use Windows paths, `file:///` links, external CSS, external JavaScript, local image tags, or project folder dependencies.

## Executive Assistant Handoff Rules

The exported HTML must tell the Executive Assistant:

1. what to post
2. which platform
3. when to post
4. what image to use
5. where the image is, if supplied
6. what not to post until an image exists

Use only these handoff status labels:

1. `Ready to post`
2. `Copy approved, image still needed`

## Optional Delivery

Google Drive is only an optional manual delivery location.

Optional delivery: after exporting the Executive Assistant handoff, upload the HTML file and any images folder to Google Drive, email, or another shared location.

Do not ask Leigh for a Google Drive local path. Do not create a compressed package requirement. Do not add an upload workflow.

## Platform Compliance Audit

For each future asset, audit:

1. platform fit
2. length fit
3. opening line fit
4. CTA fit
5. image instruction fit
6. Tides of Knowing voice fit
7. risk of generic social copy
8. risk of overpromising
9. risk of fortune-telling style language

Classification must be one of:

1. Strong
2. Acceptable
3. Needs Review
4. Needs Regeneration

Do not automatically regenerate unless the generation run explicitly calls for that next step.

## Final Generation Report

Report:

1. Campaign Focus Interpretation, if applicable
2. Prompt Library and platform prompt files loaded
3. resolved Source ID, Source title, and Source URL
4. weekly folder path
5. files created
6. per-asset campaign focus audit
7. per-asset platform compliance audit
8. any items needing Leigh review
9. usage ledger row appended, if applicable

Do not report old scheduler files, image tracking files, compressed packages, or automatic delivery copying as required outputs.
