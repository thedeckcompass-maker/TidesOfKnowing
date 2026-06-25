# Tides of Knowing Practice Commons

# Community Development Document

## 1. Purpose of This Document

This document defines the phased development architecture for the Tides of Knowing Practice Commons before public launch and beyond.

The Practice Commons is not intended to function as a generic discussion forum, social media group, Reddit-style thread system, or Facebook replacement.

Its purpose is to become the central learning environment for Tides of Knowing.

The Community must support:

* better tarot questions
* thoughtful reading practice
* symbolic interpretation
* reader development
* reflective discussion
* respectful disagreement
* gradual progression toward the COMPASS Method™
* future integration with Field Notes, Articles, Ask Leilia, training, and courses

The immediate build priority is to create the simplest version of the Practice Commons that is safe, useful, educationally coherent, and manageable by one administrator.

Initial administrator:

Leilia
[hello@tidesofknowing.com](mailto:hello@tidesofknowing.com)

There are no moderators at launch.

Expected initial scale:

A few hundred active members.

The objective is not to build every possible community feature. The objective is to build only what is required for a strong member experience, effective administration, and long-term educational architecture.

---

# 2. Core Community Principle

The Practice Commons should feel like a guided learning environment.

It should not feel like:

* Reddit
* Facebook
* a general spiritual chat group
* a public debate forum
* a popularity contest
* a high-volume social feed

The design should encourage people to slow down, ask better questions, share context, respond with care, and learn through practice.

The strongest architecture is:

Knowledge Ecosystem
→ Practice Commons
→ Learning Rooms
→ Discussions
→ Replies
→ Field Notes
→ Articles
→ COMPASS Method™ lessons
→ Future courses and reader training

The Practice Commons is not an isolated destination.

It is the living practice layer of Tides of Knowing.

---

# 3. Current Architecture in Plain English

At present, the community works as follows:

A member authenticates.

They arrive in the Practice Commons.

They enter a learning room.

They create a discussion.

Other members reply.

The discussion may include a spread image if it belongs to Reading Practice.

The member may opt in for the discussion to be considered for a future Field Note.

Leilia can participate, pin, hide, delete, or moderate content where the current controls exist.

The architecture currently supports a simple discussion model:

Discussion
→ Replies

Replies are flat.

There are no replies to replies.

This is intentional and should be retained for launch.

Flat replies keep the conversation readable and prevent the community from becoming fragmented into side arguments.

---

# 4. Existing Core Components

## 4.1 Community Posts

Discussions are stored as community posts.

Each post includes:

* room relationship
* author relationship
* title
* slug
* body
* discussion type
* optional image for Reading Practice
* Field Note consideration checkbox
* publication status
* pinned state
* search vector

This is a sound foundation.

## 4.2 Community Replies

Replies are stored separately.

Each reply includes:

* post relationship
* author relationship
* body
* status
* timestamps

Replies are currently flat.

This should remain unchanged for Phase 1.

## 4.3 Rooms

Rooms organise the learning environment.

Current rooms include:

* Community Home
* Reading Practice
* Reader Development

The room structure is a strength because it frames participation as practice rather than general posting.

## 4.4 Discussion Types

Discussion categories have been redesigned to support learning rather than generic forum behaviour.

Current or planned categories include:

* Reading Practice
* Spread Feedback
* Card Combination
* Clarifier Question
* Repeating Cards
* Reading Dilemma
* Symbolism & Imagery
* Question Framing

This is one of the most important features of the current architecture.

The discussion type should act as a teaching prompt.

It should help the member understand what kind of learning activity they are entering.

## 4.5 Field Note Consideration

Members can opt in for a discussion to be considered for a Field Note.

This should be retained and developed later into a full Field Note workflow.

At launch, the checkbox is enough.

## 4.6 Member Capabilities

Members can currently:

* create discussions if active
* reply to discussions
* edit their own discussions
* receive email notifications when someone replies to their own post, if enabled
* manage basic email preferences

Members cannot currently:

* delete or self-hide their own content
* edit replies through visible UI
* subscribe to discussions
* mention other members
* quote replies
* upload images in replies

Most of these absences are acceptable for launch.

The key missing member capability is self-removal of their own content.

## 4.7 Administrator Capabilities

Admin capabilities currently include or partially include:

* edit discussions
* hide posts
* delete posts
* pin or unpin posts
* backend support for lock
* backend support for restore
* backend support for member restriction or blocking
* moderation action logging

Current gaps:

* no visible reply moderation controls
* no practical admin moderation dashboard
* no report queue
* locked posts currently risk disappearing instead of remaining readable
* restricted and blocked member controls appear informational rather than operational
* no Field Note candidate workflow beyond checkbox data

---

# 5. Strengths of the Current Architecture

## 5.1 The Community Is Already Educationally Oriented

The current structure is not built around generic topics.

It is built around learning behaviours.

That is correct.

Reading Practice, Question Framing, Symbolism, Spread Feedback and Reader Development are active learning modes.

This supports the long-term goal of developing better readers, not just increasing discussion volume.

## 5.2 Flat Replies Are Appropriate

Threaded replies should not be added for launch.

Nested replies encourage fragmentation, side arguments, and hierarchy.

A learning environment benefits from one coherent conversation.

Current structure:

Discussion
→ Replies

This should remain the default.

## 5.3 Field Note Consideration Is Strategically Valuable

The Field Note checkbox gives members a sense that their thoughtful work may contribute to the wider body of Tides of Knowing knowledge.

This reinforces:

* quality
* reflection
* symbolic depth
* community contribution
* the connection between practice and published authority

It should be retained and expanded later.

## 5.4 Room-Specific Guidance Supports Culture

Posting guidance is not decorative.

It is part of the educational architecture.

The more clearly each room explains what belongs there, the less moderation will be required later.

## 5.5 Simple Administration Is Appropriate

One administrator does not need enterprise tooling.

The priority is a small, practical admin layer that lets Leilia see what needs attention quickly.

## 5.6 No Popularity Mechanics

The current absence of likes, badges, reputation scores, and follower counts is a strength.

These features would distort the culture.

The Practice Commons should reward thoughtfulness, not performance.

---

# 6. Weaknesses and Risks

## 6.1 No Reporting Workflow

This is the most important pre-launch moderation gap.

With one administrator, Leilia cannot rely on manually noticing every problem.

Members need a simple way to report:

* inappropriate content
* spam
* unsafe behaviour
* disrespectful replies
* privacy concerns
* off-topic or disruptive posting

This does not need to be complex.

A simple report button and admin queue are enough.

## 6.2 Reply Moderation Is Not Visible Enough

Admin needs direct controls beside each reply:

* hide
* delete
* restore

Without visible reply controls, moderation will be inefficient.

## 6.3 Locked Discussions Need to Remain Visible

Locked should mean:

This discussion remains readable, but no new replies can be added.

Locked should not mean hidden.

This distinction matters because some locked discussions may remain valuable learning artefacts.

## 6.4 No Self-Removal for Members

Members should be able to remove their own posts and replies.

This should be implemented as soft delete or self-hide, not permanent database deletion.

The member-facing language should be simple:

Remove my post
Remove my reply

## 6.5 No Flood Protection

Before public launch, the community needs lightweight posting limits.

This protects against:

* spam
* accidental duplicate posting
* emotionally reactive over-posting
* bot-like behaviour

This should be minimal and invisible to normal members.

## 6.6 Search Is Too Basic for Future Use

Current search is acceptable for early launch, but it only searches discussions, not replies.

It does not yet support:

* filters
* unanswered discussions
* discussion type browsing
* latest activity sorting
* Field Note candidates
* card or symbol discovery

This can wait until Phase 2.

## 6.7 Discussions Are Not Yet Connected to the Wider Ecosystem

At present, a discussion can exist in isolation.

Long term, discussions should connect to:

* Field Notes
* Articles
* Ask Leilia
* COMPASS Method™ lessons
* future courses
* symbolic knowledge hubs

This should not be overbuilt before launch, but the architecture should leave room for it.

---

# 7. Launch Position

Before advertising or inviting members, the community should be capable of handling:

* new member posting
* spread image uploads
* replies
* reporting
* basic moderation
* locked discussions
* self-removal
* admin review
* unanswered discussion discovery
* basic search
* email notifications for replies to own posts

The launch version does not need advanced community mechanics.

It needs to feel safe, calm, guided, and worth returning to.

---

# 8. Phase 1: Launch Essentials

## Phase 1 Goal

Create a stable, safe, thoughtful, single-admin learning community that is ready for public invitation.

This phase should be completed before advertising or inviting a wider group of members.

---

## 8.1 Fix the Discussion Type Constraint

Priority: Critical

The database must accept all currently intended discussion types.

Required action:

Apply or verify the pending migration that expands allowed discussion types to include:

* Symbolism & Imagery
* Question Framing

Reason:

If the UI allows a discussion type that the database rejects, members will encounter failed posting.

Launch should not proceed until UI taxonomy and database constraints match.

---

## 8.2 Member Reporting

Priority: Critical

Add a report action to:

* discussions
* replies

A report should capture:

* reported content type
* reported content ID
* reporting member ID
* reason
* optional details
* status
* created timestamp
* reviewed timestamp
* reviewed by admin

Suggested report reasons:

* Spam
* Disrespectful or harmful
* Privacy concern
* Off-topic
* Duplicate
* Other

Member-facing language:

Report this discussion
Report this reply

After submission:

Thank you. This has been sent to Leilia for review.

Avoid dramatic language.

The goal is safety, not surveillance.

---

## 8.3 Admin Report Queue

Priority: Critical

Create a practical admin view showing:

* new reports
* content reported
* reporter
* reason
* details
* link to discussion
* action buttons

Admin actions:

* dismiss report
* hide content
* delete content
* lock discussion
* restrict member
* block member

This dashboard should be simple.

It does not need analytics, charts, automation, severity scoring, or moderator assignment.

---

## 8.4 Visible Reply Moderation Controls

Priority: Critical

Add admin controls beside each reply:

* hide
* delete
* restore

These should only appear to Leilia/admin.

Reply moderation must be available directly in context.

Admin should not need to use the database or backend manually.

---

## 8.5 Lock Discussions Properly

Priority: Critical

Locked discussions must remain visible.

Locked discussion behaviour:

* discussion remains readable
* existing replies remain readable unless individually hidden or deleted
* reply form is disabled
* clear message appears

Suggested message:

This discussion has been closed to new replies, but remains available for reading.

Locked must not behave as hidden.

This is a launch requirement.

---

## 8.6 Member Self-Removal

Priority: High

Members should be able to remove:

* their own discussion
* their own reply

This should be a soft delete or self-hide.

Suggested member-facing language:

Remove my discussion
Remove my reply

After removal:

This discussion has been removed by its author.
This reply has been removed by its author.

Admin should still be able to see removed content in the admin dashboard if required.

Reason:

Members need agency over their own contributions, especially in a reflective or spiritual learning space.

---

## 8.7 Basic Flood Protection

Priority: High

Add lightweight rate limits.

Suggested starting limits:

* maximum 3 new discussions per member within 10 minutes
* maximum 10 replies per member within 5 minutes
* maximum 5 reports per member within 10 minutes

These numbers can be adjusted.

Member-facing message:

You’re posting quite quickly. Please wait a moment before trying again.

Do not over-explain.

This is not a discipline system.

It is basic platform protection.

---

## 8.8 Admin Dashboard

Priority: High

Create one practical admin dashboard.

Minimum sections:

* Reports
* Hidden posts
* Hidden replies
* Locked discussions
* Deleted/self-removed content
* Restricted members
* Blocked members
* Field Note candidates

Required quick actions:

* view
* hide
* delete
* restore
* lock
* unlock
* restrict member
* block member
* dismiss report

This should be functional rather than elegant.

The goal is for one administrator to see what needs attention.

---

## 8.9 Field Note Candidate View

Priority: High

The existing Field Note checkbox should feed into an admin view.

Minimum view:

* discussion title
* author
* room
* discussion type
* created date
* link to discussion
* checkbox status

Optional Phase 1 admin actions:

* mark reviewed
* mark selected
* mark not suitable

If time is tight, this can be limited to a simple list.

Reason:

The checkbox is strategically important, but it needs to be visible to Leilia.

---

## 8.10 Unanswered Discussions View

Priority: High

Add a member-facing way to find discussions with no replies.

Preferred language:

Waiting for another perspective

Avoid:

Unanswered

Reason:

The wording should encourage collaborative contribution rather than suggest neglect.

This can be a simple filter or homepage section.

Suggested placement:

Community home
Reading Practice room
Reader Development room

---

## 8.11 Basic Discovery Filters

Priority: Medium-High

Before launch, add only the simplest filters.

Recommended Phase 1 filters:

* room
* discussion type
* waiting for another perspective

Do not add full tagging yet.

Do not add advanced faceted search yet.

Reason:

Members need enough guidance to find meaningful discussions without turning the platform into a complex database.

---

## 8.12 Reply Notification Review

Priority: Medium

Current notification behaviour:

Members can receive email notifications when someone replies to their own post, if enabled.

This is enough for launch.

Required check:

* email is not duplicated
* email wording is calm and clear
* unsubscribe/preference link works
* notification only fires for valid published replies
* admin-hidden replies do not trigger inappropriate notifications

No complex notification system is required for Phase 1.

---

## 8.13 Community Culture Copy

Priority: High

Before launch, finalise the visible community guidance.

Required pages or sections:

* Community welcome
* Room guidance
* Posting guidance
* Reply guidance
* Community principles
* Reporting explanation
* Field Note consideration explanation

Tone:

* calm
* thoughtful
* specific
* educational
* non-punitive

Avoid:

* legalistic rules as primary culture language
* generic “be kind” copy
* heavy-handed spiritual language
* social media language such as “engage”, “react”, “follow”, or “go viral”

---

## 8.14 Launch Testing Checklist

Priority: Critical

Before public invitation, test:

Member journey:

* sign in
* arrive at personalised welcome
* enter Reading Practice
* create Reading Practice discussion
* upload spread image
* tick Field Note consideration
* create Reader Development discussion
* reply to discussion
* receive reply notification
* edit own discussion
* remove own discussion
* remove own reply

Admin journey:

* view reports
* report appears in queue
* hide discussion
* restore discussion
* delete discussion
* hide reply
* restore reply
* delete reply
* lock discussion
* locked discussion remains readable
* reply form disabled on locked discussion
* restrict member
* blocked member cannot post
* view Field Note candidates
* view unanswered discussions

Search/discovery:

* search returns discussions
* room filtering works
* discussion type filtering works
* waiting for another perspective works

Technical:

* database constraints match UI
* build passes
* migrations applied
* no duplicate emails
* no broken routes
* mobile layout works
* image upload works
* access controls work

---

# 9. Phase 1 Features Explicitly Deferred

The following features should not be built before launch.

They are intentionally deferred.

## 9.1 Threaded Replies

Deferred because:

* they fragment learning
* they encourage side arguments
* they make discussions harder to read
* they make moderation harder
* they are unnecessary for the initial community size

Possible future review:

Only reconsider if discussions regularly exceed 50 meaningful replies and become difficult to follow.

## 9.2 Likes and Reactions

Deferred because:

* they create popularity behaviour
* they reward speed and agreement
* they can make quieter members feel ignored
* they shift attention from reflection to validation

Possible future review:

Consider non-public “thank you” or “this helped me” signals only if there is a clear educational reason.

## 9.3 Badges, Points, Reputation, Leaderboards

Deferred because:

* they gamify the wrong behaviour
* they create hierarchy
* they can distort spiritual and interpretive practice
* they are unnecessary with one administrator and a few hundred members

Possible future review:

If added later, recognition should be editorial, not algorithmic.

Example:

Featured thoughtful contribution of the week.

## 9.4 Private Messaging

Deferred because:

* it creates safety and boundary issues
* it increases moderation burden
* it can pull learning out of the public commons
* it may create expectations Leilia cannot manage

Possible future review:

Only reconsider when there are moderators, clear safeguarding policies, and a strong reason.

## 9.5 Mentions

Deferred because:

* they encourage social media behaviour
* they can create pressure to respond
* they are not required for launch

Possible future review:

Could be useful later for notifying Leilia or course cohorts, but not now.

## 9.6 Quoting

Deferred because:

* normal text quoting is enough
* dedicated quote tools can encourage debate-style rebuttals
* not needed for launch

Possible future review:

Reconsider only if members struggle to respond clearly in longer discussions.

## 9.7 Tags

Deferred from Phase 1 because:

* manually created tags quickly become messy
* too many tags confuse members
* AI-assisted tagging should be designed properly in Phase 2

Possible future review:

Add controlled vocabulary and AI-assisted suggestions after real discussion data exists.

## 9.8 Advanced Search

Deferred because:

* Phase 1 only needs basic search and filters
* advanced search should be informed by actual member behaviour

Possible future review:

Add card, symbol, theme, author, Field Note, and COMPASS filters in Phase 2 or 3.

## 9.9 Merge and Split Discussions

Deferred because:

* too complex for launch
* not needed at small scale
* can be handled manually through admin replies

Possible future review:

Add only if duplicate discussions become frequent.

## 9.10 Multi-Moderator Workflow

Deferred because:

* there are no moderators
* building assignment, escalation, and permissions now is premature
* one admin needs simplicity

Possible future review:

Revisit when active membership exceeds what Leilia can personally monitor.

---

# 10. Phase 2: Community Growth

## Phase 2 Goal

Improve discovery, return visits, connection between discussions, and early knowledge architecture once real member behaviour is visible.

Phase 2 should begin only after launch behaviour has been observed.

Suggested trigger:

* 100+ discussions
* consistent weekly replies
* repeated themes appearing
* Leilia can identify common learning patterns

---

## 10.1 Activity-Based Sorting

Add sorting by latest activity.

Current:

Pinned first, newest created first.

Phase 2:

Pinned first, then latest activity.

Latest activity should include:

* new reply
* admin update
* possibly Field Note selection status

Reason:

Good discussions should not vanish because they were created earlier.

---

## 10.2 Related Discussions

Add automatic related discussion suggestions.

Initial logic can be simple:

* same discussion type
* same room
* similar title/body text
* shared card or symbol tags once tagging exists

Member-facing label:

Related practice discussions

This supports deeper exploration without requiring members to search manually.

---

## 10.3 AI-Assisted Tagging

Add AI-assisted tagging as an organisational tool.

Purpose:

AI acts as librarian, not teacher.

It should suggest metadata, not interpretation.

Suggested tag categories:

* tarot cards
* suits
* numbers
* archetypes
* symbols
* reading issue
* spread type
* question type
* emotional theme
* COMPASS concept, later
* article relationship, later
* Field Note relationship, later

Rules:

* members should not be overwhelmed by tags
* admin should be able to review or edit system tags
* AI tags should never replace member meaning
* AI should not write interpretations for members

Member-facing language should not over-emphasise AI.

Preferred language:

Suggested topics

or

Practice themes

---

## 10.4 Better Browse Experience

Add browse pages or filters for:

* discussion type
* card
* symbol
* reading issue
* waiting for another perspective
* recently active
* Field Note candidates, if publicly appropriate later

This supports discoverability.

The browsing system should feel like a study library rather than a forum index.

---

## 10.5 Weekly Community Reflection

Add a weekly digest or reflection.

This could be email or onsite.

Possible sections:

* discussions waiting for another perspective
* thoughtful conversations from the week
* emerging themes
* new Field Notes
* new articles
* practice prompts

This should not be a noisy newsletter.

It should feel like a weekly learning pulse.

---

## 10.6 Featured Discussion

Add one featured discussion chosen by Leilia.

This should not be algorithmic.

Purpose:

* model quality
* reinforce culture
* surface good practice
* encourage return visits

Possible label:

Featured Practice Discussion

Avoid:

Top post
Most popular
Trending

---

## 10.7 Member Learning Profiles

Add simple member profiles.

Not social profiles.

Learning profiles.

Possible fields:

* display name
* short introduction
* member since
* areas of interest
* recent discussions
* recent replies
* Field Note contributions, if applicable

Avoid:

* follower counts
* public popularity metrics
* star ratings
* reader rankings
* badges at this stage

Reason:

Profiles should support trust and learning, not hierarchy.

---

## 10.8 Article Linking

Begin linking discussions to existing TOK articles.

Initial method can be admin-selected or AI-suggested.

Example:

A discussion about question framing could suggest a relevant article on phrasing better tarot questions.

This creates a bridge between community practice and published authority.

---

## 10.9 Field Note Workflow Expansion

Upgrade Field Note consideration from a checkbox to a workflow.

Suggested states:

* member opted in
* admin reviewed
* selected
* not selected
* Field Note drafted
* Field Note published

Add structured links:

Discussion → Field Note
Field Note → Original discussion

This turns community practice into visible knowledge creation.

---

# 11. Phase 3: Advanced Learning Ecosystem

## Phase 3 Goal

Integrate the Practice Commons with the full Tides of Knowing educational ecosystem, including COMPASS Method™ training, future courses, and symbolic knowledge architecture.

Phase 3 should not begin until the community has enough meaningful content to justify deeper architecture.

---

## 11.1 COMPASS Method™ Integration

Add structured relationships between discussions and COMPASS concepts.

Examples:

* clarity
* orientation
* meaning
* pattern
* action
* symbolic synthesis

Each COMPASS lesson should be able to connect to:

* relevant discussions
* practice prompts
* Field Notes
* articles
* member questions
* examples from Reading Practice

This creates a learning loop:

Lesson
→ Practice
→ Discussion
→ Field Note
→ Further lesson refinement

---

## 11.2 Lesson Discussion Spaces

Future COMPASS lessons or courses should have discussion spaces attached.

Do not create generic course comments.

Instead create guided practice discussions.

Each lesson could include:

* reflection question
* practice thread
* example interpretation
* symbolic noticing prompt
* application question

This keeps the educational culture consistent.

---

## 11.3 Symbolic Knowledge Hubs

Create structured pages for important recurring symbols, cards, themes and interpretive patterns.

Examples:

* The High Priestess
* Seven of Cups
* Repeating cards
* Clarifier questions
* Animal symbolism
* Threshold imagery
* Question framing
* The difference between prediction and discernment

Each hub could include:

* short TOK interpretation
* related articles
* related Field Notes
* related discussions
* relevant COMPASS lessons
* suggested practice prompts

This is valuable for SEO, AI search visibility and community learning.

---

## 11.4 Personal Study Collections

Allow members to save discussions or resources into private study collections.

Possible collections:

* Court Cards
* Symbolism
* Reading Practice
* Question Framing
* Professional Reader Development
* COMPASS Method™

This should be private by default.

Do not turn it into public social bookmarking.

---

## 11.5 Advanced Search

Add deeper search across:

* discussions
* replies
* articles
* Field Notes
* lessons
* symbols
* cards
* tags
* member contributions, where appropriate

Search should support learning pathways, not just keyword retrieval.

---

## 11.6 Editorial Recognition

If recognition is added, it should remain editorial.

Examples:

* Featured Practice Discussion
* Field Note Contributor
* Thoughtful Question
* Strong Symbolic Observation

Avoid algorithmic ranking.

The aim is to model quality, not create status competition.

---

# 12. Notifications Strategy

## Phase 1 Notifications

Keep notifications minimal.

Required:

* reply to your discussion

Optional:

* Leilia replied to your discussion
* your discussion was locked
* your content was removed or moderated
* your discussion was selected for Field Note consideration

Do not send excessive email.

## Phase 2 Notifications

Add meaningful return triggers:

* new reply in a discussion you participated in
* weekly community reflection
* Field Note published from a discussion
* discussions waiting for another perspective

## Phase 3 Notifications

Add learning-based notifications:

* new COMPASS lesson connected to a discussion you joined
* new Field Note related to a saved theme
* new article related to your study interests

Principle:

Notifications should support reflective return, not compulsive checking.

---

# 13. Moderation Philosophy

Moderation should be calm, clear and educational.

The community should not feel policed.

It should feel held.

Core moderation principles:

* protect member safety
* protect the learning culture
* discourage performative certainty
* prevent spam
* prevent disrespect
* avoid public shaming
* preserve valuable learning material where possible
* keep Leilia’s workload manageable

Moderation language should be plain.

Examples:

This discussion has been closed to new replies.

This reply has been removed.

This member’s posting access has been restricted.

Avoid dramatic or punitive wording.

---

# 14. Recommended Community Culture Principles

The Practice Commons should encourage:

* context before conclusion
* interpretation before prediction
* symbolic observation before advice
* curiosity before certainty
* respectful disagreement
* careful reading of the question
* attention to spread position
* awareness of the limits of any reading
* recognition that tarot practice develops gradually

Suggested member guidance:

Before posting, consider:

What am I asking?

What have I already noticed?

Where am I stuck?

What kind of response would help me learn?

When replying, consider:

What do I see in the cards?

What am I inferring?

What might I be projecting?

How can I help the reader think more clearly?

This reinforces the educational culture without sounding like rules for rules’ sake.

---

# 15. Technical Build Priorities

## Must Build Before Launch

1. Apply/verify discussion type migration.
2. Add report discussion.
3. Add report reply.
4. Add admin report queue.
5. Add visible reply moderation controls.
6. Fix locked discussions so they remain readable.
7. Add member self-removal for posts and replies.
8. Add basic flood protection.
9. Add admin dashboard.
10. Add Field Note candidate view.
11. Add waiting for another perspective view.
12. Add basic filters for room and discussion type.
13. Review reply email notification behaviour.
14. Finalise community guidance copy.
15. Complete launch testing checklist.

## Should Not Build Before Launch

1. Threaded replies.
2. Likes.
3. Reactions.
4. Badges.
5. Reputation.
6. Leaderboards.
7. Private messaging.
8. Mentions.
9. Quote feature.
10. Full manual tags.
11. Advanced faceted search.
12. Merge/split discussion tools.
13. Multi-moderator workflow.
14. Complex AI interpretation tools.

---

# 16. Public Launch Criteria

The Practice Commons is ready for public invitation when:

* members can post without friction
* Reading Practice image upload works
* discussion types save correctly
* replies work
* reports work
* admin can moderate replies and posts visibly
* locked discussions remain readable
* members can remove their own content
* Leilia can see reports and Field Note candidates
* unanswered discussions can be surfaced
* basic search and filtering work
* email notifications are not duplicating
* community guidance is visible
* mobile experience is acceptable
* build passes
* database migrations are applied
* access controls are verified

Do not advertise or invite members before these are confirmed.

---

# 17. Strategic Summary

The Tides of Knowing Practice Commons should be built as a learning commons, not a forum.

The launch version should be simple, stable and culturally clear.

The first priority is not scale.

The first priority is quality of participation.

Phase 1 protects the community.

Phase 2 improves discovery and return.

Phase 3 connects the community to the full Tides of Knowing knowledge ecosystem.

The best architecture is the simplest one that helps members practise better, think more clearly, and gradually move toward the COMPASS Method™.

Everything else can wait.

---

# Launch Readiness & Success Criteria

This section is the authoritative definition of when the Practice Commons is ready for public invitation.

## Definition of Launch Ready

The Practice Commons is considered launch ready only when all Phase 1 requirements have been completed and verified.

The launch version does not need every planned feature.

It needs to provide a safe, stable, educationally coherent experience that reflects the philosophy of the Community.

Launch readiness includes, at minimum:

* members can confidently create, edit and remove their own discussions
* members can reply to discussions without friction
* Reading Practice image uploads work reliably
* Field Note consideration workflow is operational
* Community reporting functions correctly
* Leilia can efficiently moderate discussions and replies without database intervention
* locked discussions remain readable while preventing new replies
* flood protection and basic abuse prevention are functioning
* search and basic discussion discovery support learning
* email notifications work correctly without duplication
* mobile and desktop experiences are both usable
* all Phase 1 database migrations have been applied
* build, permissions and deployment checks have passed

## Definition of Success

Success is not measured by:

* number of members
* number of posts
* engagement metrics
* time spent on site

Success is measured by:

* thoughtful discussions
* respectful interactions
* improved symbolic thinking
* members helping other members learn
* discussions contributing to Field Notes
* increasing confidence in reading practice
* strengthening the wider Tides of Knowing knowledge ecosystem

## Phase Completion Principle

Phase 1 should be considered complete once the Community is stable, safe and genuinely useful for its intended audience.

Do not continue adding Phase 2 or Phase 3 functionality simply because it exists in the roadmap.

Instead, public launch should occur, real member behaviour should be observed, and future development should be guided by evidence gathered from actual community use rather than assumptions.
