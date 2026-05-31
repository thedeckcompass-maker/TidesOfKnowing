# Tides of Knowing Symbolic Lexicon: Review Workflow

## Purpose

This document defines the review workflow for card records in the Tides of Knowing Symbolic Lexicon.

The workflow protects the quality, consistency, originality, cultural care, and long-term usability of the dataset.

## Record statuses

Use these statuses:

draft
reviewed
approved
published
archived

## Draft

A card record begins as draft.

At draft stage, the record may be incomplete, unreviewed, or experimental.

Draft content may be used for internal planning and internal AI-assisted development, but it should not be treated as public-ready.

## Reviewed

A record becomes reviewed once the major content sections have been checked for coherence, completeness, originality, and structural consistency.

Reviewed does not automatically mean published.

## Approved

A record becomes approved once it is suitable for one or more defined uses.

Approval may be specific to website use, game use, email use, paid training use, or internal AI-assisted workflow use.

## Published

A record becomes published when it is live or actively used in a public-facing context.

Before publication:

metadata.status should be approved or published.

publicationStatus.approvedForPublicWebsite should be true.

usageFlags.showOnPublicCardPage should be true.

usageFlags.requiresReviewBeforePublication should be false.

## Archived

A record becomes archived when it should no longer be used as active source material.

Archived records should be retained for traceability unless there is a specific reason to delete them.

## Review areas

Each card record should be reviewed across these areas:

interpretive
contextual
lineage
spanish
seo
cultural

## Interpretive review

Check:

upright meaning
reversed meaning
teaching note
practical meaning
emotional meaning
relational meaning
creative meaning
spiritual meaning
shadow meaning

Reversed meanings should not simply be negative.

## Contextual review

Check:

relationship
romance
business
innerDevelopment

Each context should use the same structure:

essence
keywords
phrases
watchFor
readerNote

## Vocabulary review

Check:

Clear Current
Deep Current
Hidden Current

Each level should be distinct.

Clear Current should be recognisable.

Deep Current should be nuanced.

Hidden Current should stretch symbolic thinking without becoming obscure for the sake of obscurity.

Avoid generic filler.

## Lineage review

Check that each lineage is labelled honestly.

Old English Inspired is not literal Old English.

Norse Saga Inspired is not Old Norse translation.

Biblical Prophetic is not religious doctrine.

Greek Mythic Philosophical is an inspired interpretive register, not a scholarly claim.

Aotearoa Ecological should use English-language place-aware ecological imagery unless separately reviewed.

## Spanish review

Spanish is included as a learning and review layer.

Spanish terms should be checked by a fluent speaker before public use.

Do not treat Spanish draft content as publication-ready until reviewed.

## SEO review

Check:

meta title
meta description
canonical topic
schema-ready description
related entities
FAQ seeds
internal link targets

SEO fields should support page creation without becoming full article drafts inside the data record.

## Cultural review

Any culturally specific or historically inspired material should be handled carefully.

Do not imply scholarly authority where the content is stylistic or inspired.

Do not include te reo Māori without a clear review process.

## Versioning

Use semantic versioning.

1.0.0 means initial approved record.
1.1.0 means expanded content.
1.1.1 means small correction or copy edit.
2.0.0 means structural change or major reinterpretation.

Major interpretive changes require a version update.
