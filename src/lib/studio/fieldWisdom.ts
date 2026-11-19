export type FieldWisdom={personal?:string;practical:string};
export const FIELD_WISDOM:Record<string,FieldWisdom>={};
const lines=String.raw`
exchange.title|What should an artist understand about this direction?|Give this selected visual brief a short title. Saving a draft does not share it.
exchange.selected_text|Which qualities of your work should an artist understand and protect?|Open your saved Visual Design Book, then copy the exact passage you want to include. Review it for private details. Only this passage and explicitly selected previews enter the draft.
making.plannedCardCount||Enter the number of cards you currently plan to produce. You can revise it as the deck develops.
making.bookThickness||Record the proposed page count, paper and thickness so the book and packaging can be planned together. Confirm estimates with your printer.
making.fitNotes|What should feel considered when someone opens the deck?|Note how the cards, book and packaging fit together, and any measurements or supplier answers still needed.
accountCapture.text|What would you like to remember or explore?|Save a fragment in your private inspiration, or confirm a project or card destination first.
accountCapture.project|Which project does this idea belong with?|Choose one of your projects. You do not need to choose a card.
accountCapture.scope||Keep the idea with the project, or choose an existing card.
accountCapture.card||Choose an existing card in this project. Its saved guidebook sections will then appear.
accountCapture.section||Choose the section where this writing belongs. Existing writing is kept.
capture.text|Which idea or phrase would you like to keep developing?|Save an idea now, or choose a destination when you are ready. Existing card writing is kept.
capture.cardId||Choose an existing card in the selected project.
capture.sectionId||Choose the shared guidebook section where this writing belongs.
book.bookTitle|What name captures the experience you are offering?|Enter the title as you want readers to see it on this book surface.
book.subtitle||Add a subtitle if it helps explain the book's purpose or audience.
book.author||Enter the author's name as it should appear in the book.
book.artist||Enter the artist's credited name as agreed with them.
book.imprint||Enter your publishing imprint if you use one; otherwise leave this blank.
book.textHolder||Enter the verified rights holder for the text. This field does not assign ownership.
book.textYear||Enter the applicable copyright year for the text, if known.
book.artHolder||Enter the verified rights holder for the artwork, following your agreement.
book.artYear||Enter the applicable copyright year for the artwork, if known.
book.edition||Identify this edition if needed, such as First edition. Leave blank until decided.
book.publisher||Enter the publisher's name as it should appear in the publication details.
book.credits|Whose contribution would you like readers to recognize?|List contributors and their agreed credits, checking names and roles.
book.permissions||Record the acknowledgements or permission wording required for material you use. Do not imply permission you have not obtained.
book.isbn||Enter an assigned ISBN only. Leave blank if none has been assigned.
book.website||Enter the website you want readers to visit, and check the address before publication.
book.identifier||Enter another publication identifier only if your edition needs it.
book.blurb|What would invite your intended reader to explore this deck?|Write a concise back-cover description in your own voice, with accurate expectations.
book.surface||Choose which part of the finished book this section represents.
book.placement||Choose front matter, the main text or back matter to position this section.
book.format||Choose your intended book format. Cover and spine options depend on it.

creative.purpose|What central intention should help you decide what belongs in the deck?|Describe what the deck helps people explore or do.
creative.audience|Who would you most like to reach, and what matters to them?|Describe the people who will use the deck, their interests and the situations in which it may help.
creative.vision|What would make this project feel worthwhile to you?|Describe the deck you hope to create and the experience it will offer.
creative.perspective|What does your experience or way of seeing bring to this subject?|Describe the distinctive approach that will guide your card writing and imagery.
creative.experience|How would you like someone to feel or think after using a card?|Describe the encounter you want to create, without promising an outcome.
creative.voice|Which words and qualities feel natural to your own voice?|Describe the tone, language and presentation that suit your intended audience.
outline.name|What kind of guidance belongs in this part of every card entry?|Give the section a short, clear heading. Renaming it preserves existing writing.
outline.writing|What would you like this card to offer a deck user?|Write the material for this section in your own voice. You can save an unfinished entry and return later.
outline.format||Choose a suggested structure or create your own. Any format can be customized.

spark.backgroundNotes|Which interests or ways of seeing would you like the work to carry? A simple creative influence is enough; private history is not required.|Add optional context for your starting point. This remains separate from a reader-facing biography.
spark.heart|What keeps inviting your attention: an image, question, subject or possibility? Let it be unfinished rather than forcing a polished concept.|Capture the central idea in your own words. These original reflections remain separate from the editable North Star.
spark.inspiration|Remember the moment or observation that made the idea feel worth exploring. You can describe the spark without identifying anyone involved.|Record an origin or influence you may want to revisit; this is not automatically included in public copy.
spark.why|If this deck never became a product, what would still make creating it worthwhile?|Name what gives the project meaning to you. A sentence is enough; intimate disclosure is not needed.
spark.experience|Imagine someone pausing with one of your cards. What might they notice, feel or see differently?|Describe a hoped-for encounter rather than a guaranteed outcome.
spark.perspective|What do you notice here that is easily overlooked? Your particular attention can matter more than an impressive credential.|Identify the perspective the deck brings, using examples you are comfortable keeping in the project.
spark.connection|Which creative, cultural or professional influences help you understand this subject? Choose only what you wish to record.|Keep relevant connections and acknowledge where further research, permission or consultation may be needed.
spark.expression|Would you like the encounter to feel spacious, playful, grounded or challenging? What kind of language would support that?|Describe the tone of the experience before making visual or typographic decisions.
spark.principles|What must remain recognisable even if the project changes substantially?|Record a few creative principles to guide later trade-offs, rather than rules you must never revise.
northStar.idea|What is the smallest clear statement that still feels alive to you?|Summarise the deck's central idea here. Editing this North Star does not replace your original reflections.
northStar.why|What gives this work a reason to exist beyond simply adding more cards to the world?|Keep the motivating purpose visible as a working summary, not a public biography.
northStar.contribution|What particular insight, approach or experience can this deck offer?|Name its contribution without claiming it must be unprecedented or useful to everyone.
northStar.experience|What invitation would you like someone to feel when first using the deck?|Describe the intended experience in a way you can later compare with feedback from people using the deck.
northStar.principles|Which qualities would you protect when deciding what to simplify or leave out?|Keep a concise set of guiding principles. Your North Star may evolve; earlier saved versions remain available.
foundation.intention|What might become possible through these cards: reflection, learning, play, conversation or something else?|Describe the central invitation. You can combine purposes without promising a particular result.
foundation.essential|If the deck became simpler, which part would you most regret losing?|Identify the essential purpose to protect when scope or production choices require trade-offs.
foundation.people|Imagine a person who could value this work without having to invent a detailed customer persona.|Describe their interests, starting knowledge or circumstances; avoid unnecessary names or sensitive information.
foundation.context|Where might the cards be used: privately, with a facilitator or in a shared space? What support might that setting call for?|Record the use setting and explanation needed, not a restriction on who is allowed to enjoy the work.
foundation.encounter|Picture the first few minutes with the finished deck. What should feel welcoming or understandable?|Describe a concrete first-use experience you can later test with readers.
foundation.promise|What invitation can you offer honestly while leaving room for a reader's own interpretation?|Distinguish intended benefit from guaranteed outcome, diagnosis or professional advice.
foundation.voice|If the imagery disappeared, what qualities would you still want readers to recognize in the words?|Describe tone and language choices that can guide consistent editing across the deck.
foundation.conventions|Which terms feel necessary to your method, and which might need a gentle explanation?|Note terminology, spelling conventions or an existing system you will use. Definitions can be developed later.
foundation.principles|Which editorial choices make the work feel like yours without limiting how a reader responds?|Record principles you can apply when reviewing a card, such as clarity, nuance or respectful attribution.
foundation.heart|What belongs so firmly at the centre that the deck would feel different without it?|Keep essential themes here; this is scope planning, not a requirement to include every related idea.
foundation.exploring|Which possibilities still feel promising even though their place is uncertain?|Hold open ideas without committing to cards, artwork or production expense yet.
foundation.deferred|What could be preserved for another edition or project rather than forced into this one?|Record deferred ideas so choosing a smaller scope does not mean losing them.
foundation.responsibility|Whose knowledge, experience or creative contribution does the deck draw upon?|Record permissions, attribution and consultation questions to investigate. A note is not evidence of clearance.
foundation.questions|What uncertainty would be most useful to carry into the next chapter?|Keep unanswered questions visible; you do not need to resolve them before continuing.
brief.intention|Does this wording still express the invitation you want the deck to offer?|Edit a concise central intention for the Creative Brief; original Foundation responses stay separate.
brief.people|Can you recognize the intended reader without making them fit a narrow stereotype?|Summarise who may value the work and the setting in which they may use it.
brief.experience|What kind of encounter should these editorial choices support?|Bring the intended experience and responsible promise together, without overstating outcomes.
brief.voice|Would another writer understand how to sound at home in this deck?|Give usable guidance about tone, terminology and language conventions.
brief.principles|Which principles could help you make a difficult editing decision?|Summarise the qualities you want to preserve; this remains an evolving working document.
brief.scope|What will this deck hold well, and what is better kept for later?|Separate essential material, open exploration, deferred ideas and responsibilities.
brief.questions|Which question would unlock the most useful next decision?|Keep unresolved matters in the brief so they remain visible rather than becoming assumed facts.
architecture.form|What kind of structure serves the idea rather than making the idea fit a familiar label?|Describe the possible deck form. This reflection does not generate cards or reset the project's existing type.
architecture.structure|What pattern is already emerging: sequence, families, contrasting ideas or a network of connections?|Record organizing principles in plain language; no fixed taxonomy is required.
architecture.contribution|If this card disappeared, what distinct perspective or experience would the deck lose?|Consider each card's role in the shared collection. This note does not merge or delete cards.
architecture.balance|Where does repetition deepen understanding, and where might a new perspective help?|Note gaps, deliberate imbalance or relationships worth reviewing without automatically renumbering the deck.
architecture.use|How could someone begin using the system without needing you beside them?|Describe how cards may stand alone, connect or be sequenced, and what the companion should explain.
architecture.questions|Which structural decision still needs room to develop?|Keep open architectural questions rather than treating a provisional choice as final.
blueprint.form|Does this form still support the original creative intention?|Summarise the deck's current form in the Blueprint; it does not alter the card collection.
blueprint.structure|What makes this a coherent system rather than simply a set of subjects?|Describe the organizing principles a collaborator or future you will need to understand.
blueprint.contribution|How do the individual cards earn their places in the whole?|Record the approach to card roles; individual card text remains in the same authoritative collection.
blueprint.balance|Which relationships or contrasts give the deck depth?|Summarise intended patterns and gaps without changing existing links or card order.
blueprint.use|What should someone be able to do with this structure?|State the practical use of the system and the explanation needed to enter it.
blueprint.questions|What remains a deliberate question rather than an accidental omission?|Keep unresolved structural choices visible in the saved Blueprint.
connection.kind|Does the connection feel like contrast, progression, a shared image or something else entirely?|Name the relationship in your own words; no prescribed symbolic meaning is imposed.
connection.note|What becomes clearer when these two cards are considered together?|Explain the connection briefly. This records a link, not a copy or merged card.
card.meaning|What truth or possibility belongs to this card in particular? Give it room before reducing it to advice.|Write the main interpretation. Keep reader-facing meaning distinct from private research and artwork instructions.
card.shadow_meaning|How might this quality become unbalanced, misunderstood or difficult to recognize?|Offer an alternative or cautionary interpretation without treating a reader as faulty.
card.keywords|Which few words help you find the card's centre without flattening its nuance?|Record concise reminders or search terms; keywords do not replace the developed meaning.
card.cautions|Where could an interpretation become too absolute or invite an unhelpful assumption?|State interpretive limits and relevant cautions plainly. Do not invent medical or professional guarantees.
card.symbolism|Which visual details carry meaning, and which meanings are your own creative interpretation?|Explain important images and distinguish tradition, research and personal symbolism where relevant.
card.correspondences|Which connections enrich this card rather than merely filling a conventional list?|Record chosen associations and their basis. A correspondence does not automatically create a linked card.
card.prompts|What question leaves the reader room to discover their own response?|Write open invitations instead of questions that assume a problem or require sensitive disclosure.
card.research_notes||Keep working research here: observations, uncertainties and material to verify. It is not automatically included in reader-facing adaptations.
card.sources||Record enough detail to find and credit the source again: author, title, location or link and the specific idea used.
card.cultural_context|What context might be lost if a symbol or practice were treated as universal?|Record relevant provenance, consultation and unanswered cultural questions; do not assume permission from familiarity.
card.permissions||Record rights holder, permitted use, evidence, restrictions and unresolved requests. Pending notes are not a licence.
card.artwork_brief|What should the image invite someone to notice or feel, beyond illustrating the text literally?|Describe composition, symbols and important exclusions for an artist. Keep production specifications distinct from creative direction.
card.rights_status||State where the image came from and what permissions have actually been checked. Update the notes when evidence changes; uncertainty should remain visible.
card.production_notes||Record card-specific trim, crop, legibility or proof issues. These notes do not certify the artwork as print-ready.
card.title|What name opens the card's world without having to explain it all?|Use a recognisable title. Changing it does not change the card's identity or erase earlier versions.
card.card_number||Enter the visible number or short label for this card. It is distinct from its collection sort position.
card.sort_order||Set where this card appears in the working collection. This is not the number printed on the card.
companion.title||Name this reader-facing section so it can be recognized in the manuscript contents.
companion.order||Set its reading position within the companion. This does not renumber or reorder the deck's cards.
companion.body|Imagine a reader meeting the deck without its creator present. What explanation would help them feel ready, without deciding their interpretation for them?|Write reader-facing text. Adapted words remain independent of the source card; approval is separate from Leilia's review or print readiness.
journal.title||Give the entry a title you can recognize later. A title does not make the private entry public.
journal.body|What observation, decision or question would you be glad to remember later? Fragments are welcome; personal detail is never required.|Keep the original process record here. Creating or sharing a selected excerpt is a separate, deliberate action.
journal.replacePhoto||Choose Add to keep another current photograph, or select one to replace. Earlier originals and existing selected journey-update photographs remain unchanged and private.
symbol.captureTitle|What caught your attention?|Give this observation a working name you can find again; it need not become the card title.
symbol.captureBody|What did you notice, feel curious about or question? You do not need to disclose a sensitive experience.|Preserve your first words, research or uncertainty. Note the source of inherited or cultural meanings; an observation is not a universal claim.
symbol.sourceEntry||Choose an existing private journal entry. Linking it here does not copy its original writing or publish it.
symbol.motifs|What connection do you see between this observation and the cards?|Use your own words for motifs, contrasts or relationships. A shared image may mean different things; no fixed taxonomy is required.
symbol.why|What makes this detail matter to this particular work?|Explain the part you want to learn from or retain, and what you do not want to carry forward. Saving a reference is not reproduction permission.
symbol.pinterest||Paste the full HTTPS pinterest.com board link. We recommend a private board. The link is a private reminder, not an invitation, connection or permission for an artist to access or reproduce anything.
symbol.artistBrief|What would another person need to understand to honour the visual intention you recognize? You can leave this brief unfinished while making the artwork yourself.|Describe desired atmosphere, examples, constraints and deliberate exceptions. Keep source references and confirmed permissions clear. Switching artwork paths preserves this detail; sharing remains a separate reviewed action.
symbol.vision|What atmosphere belongs to the meaning of this deck?|Describe light, texture, space or movement. Begin with intention; physical dimensions remain in the shared deck design.
symbol.colour|What does color contribute to your deck's mood or symbolism?|Describe recurring colors and purposeful shifts. Family colors can aid recognition without requiring identical artworks.
symbol.composition|Where do you want attention to settle first?|Consider framing, scale and breathing room, including room for titles, numbers or an optional QR code.
symbol.symbols|Which motifs feel like the deck's own language?|Explain how repeated symbols change meaning across cards. Distinguish intentional variation from a connection you still want to explore.
symbol.treatment|Which materials or marks feel suited to the idea?|Describe medium, texture and artistic treatment. You may combine approaches without committing every card to one technique.
symbol.approach|How would you like to take part in making the imagery?|Record self-created, commissioned or mixed approaches, likely contributors and open questions. This does not invite or grant an artist access.
symbol.exceptions|What does this deliberate difference add?|Name the shared principle that still connects the card to the deck and the element that intentionally varies.
symbol.rights||Record sources, contributors and permissions actually confirmed, plus unresolved questions. A purchased or referenced image does not establish every reproduction right.
artist.professional_name|How do you want creators to know your artistic practice?|Use the professional name you intend the curated directory to show. This does not change your private account name or community username.
artist.location||Give the region you are comfortable sharing with admitted creators. A home address is unnecessary.
artist.time_zone||Use a time zone that helps collaborators plan conversations and deadlines. Do not infer immediate availability from it.
artist.languages||List languages you can comfortably use in a working relationship, separated by commas.
artist.biography|What experience helps a creator understand your practice?|Describe relevant work and influences without confidential client details. This may be visible in your approved directory profile.
artist.artistic_statement|What do you notice or express through your artwork?|Explain your approach in your own words. A creator should understand what draws you to the work beyond a list of styles.
artist.mediums|Which materials feel central to your work?|List the media you actually work in, separated by commas; these help creators find a suitable practice.
artist.techniques||Name techniques relevant to the examples, such as watercolor layering, digital drawing or collage. Leave room for variation.
artist.styles|What qualities recur in your visual work?|Describe recognisable visual approaches rather than claiming you can reproduce another artist's style.
artist.subjects||List subjects you welcome or know well. This supports discovery, not a commitment to accept every related brief.
artist.publishing_experience||Describe experience with cards, books, packaging or campaign images, including what you delivered. You do not need to invent prior deck work.
artist.availability||Describe your current capacity, lead time and how you prefer to discuss scheduling. This is not a booking.
artist.budget_approach||Explain how you normally scope or quote work. No price, payment or contract is agreed by submitting this profile.
artist.licensing_preferences||Describe rights you usually retain and uses you are willing to discuss. Specific reproduction permissions need a separate written agreement.
artist.collaboration_models|Which working relationships suit your practice?|List ways you like to collaborate, such as a scoped commission or licensing existing art. The creator and artist agree terms directly.
artist.process_disclosure||Choose the description that accurately reflects how the examples were made. Disclosure helps creators make an informed choice; it is not a quality rating.
artist.portfolioUrl||An uploaded image fills this link automatically. Otherwise, enter a link to your example. You do not need to copy the link.
artist.portfolioTitle||Name this particular example so a creator can discuss it clearly. It need not be the title of a finished deck.
artist.portfolioDescription|What does this example show about your approach?|Add useful context, your contribution and relevant media. Do not include private client information or grant rights you do not control.
artist.contact_email||This contact is private and excluded from the directory. Only your explicit acceptance of an intended introduction can release it to that creator.
artist.website_url||Record your practice website without embedded credentials. It remains in the separate private contact record in this slice.
artist.portfolioSlot||Choose the application example whose preview link should be populated. Uploading alone does not submit or publish your application.
artist.search||Search the approved artists' practice descriptions, mediums, styles, subjects and location. Pending applications are not included.
artist.process||Filter by the process artists disclosed for their portfolio. This does not judge originality or verify every production method.
artist.project||Choose a project you own. Only its name appears in the introduction preview; the artist receives no project, card or journal access.
artist.shortlist|What makes this practice worth returning to?|Keep your own comparison note. It stays private to your project and is not sent with an introduction.
artist.brief|What would help this artist understand the work you want to explore together?|State the proposed scope, intended use and questions in your own words. This exact brief, not your entire project, is shared after you confirm the preview.
artist.excerpt||Paste only the words you choose for this artist. Private research, journal entries and unpublished card text are never attached automatically.
artist.timeline||Describe a tentative schedule or uncertainty. Submitting a request does not book the artist or confirm delivery dates.
artist.budget||Give useful budget context or explain that scope must be discussed. This is not a price agreement, payment or permission to start work.
artist.response||Respond to this specific brief or ask for the information you need. Accepting releases mutual contacts only when you explicitly confirm consent; it never grants access to the creator's project.
artist.withdrawal||Record an optional reason in this participant-only history. Withdrawal stops future contact display here, but cannot recall details already seen. No email is sent.
journal.caption||Describe what this photograph shows and why it matters to the process. The caption does not publish the photograph or establish image rights.
excerpt.title||Name this selected journey update so you can find it among your prepared excerpts.
excerpt.text|Which part of the experience would you feel comfortable sharing, and what belongs only in your private journal?|Choose and edit the exact words for a separate excerpt. Preparing it does not post it or change the source entry.
project.name|What working name helps you recognize the project without needing to settle its final public title?|Use a name that distinguishes this project in your list and exports.
project.deck_size||Enter the planned number of cards, not physical width or height. It can remain provisional as the collection develops.
project.purpose|What central intention should help you decide what belongs in the deck?|Describe what the deck helps people explore or do.
project.intended_reader|Who could value this work, and what starting point might they bring?|Describe relevant interests or context rather than collecting personal information about actual readers.
project.promise|What can you responsibly invite a reader to explore without promising a guaranteed result?|State the deck's intended offer and limits in clear language.
project.description|What would help you recognize the project's character at a glance?|Keep a working description for your overview and exports; it is not automatically public marketing copy.
project.next_action|What is one small action that would make the next decision easier?|Name a concrete next step, rather than the entire remaining project.
project.current_risk|Which uncertainty deserves attention before you invest more work or money?|Record the risk and what evidence or decision could reduce it; this is not a demand to predict everything.
family.name|What shared quality makes these cards feel related?|Name a working family or group; a family is an organizing aid, not a second copy of its cards.
family.description|What should belonging to this family contribute to the reading of a card?|Explain the group's organizing idea and any deliberate exceptions.
family.sort_order||Set the family's place in the collection display. Its order is separate from individual card numbers.
guidebook.title||Name this section so it is recognisable in the companion contents and linked-card view.
guidebook.body|What will the reader need here that does not belong on the card itself?|Write the section's manuscript text. It remains the same underlying guidebook record used by the Companion tools.
guidebook.sort_order||Set the section's manuscript reading position. Gaps are allowed; it is not a card number.
visual.notes|What atmosphere or visual relationship matters more than any single reference image?|Explain your visual intention and note where references came from. A reference is not permission to reproduce it.
reference.note|What specific quality are you learning from this example: palette, texture, composition or mood?|Describe the intention and identify the source. This private reference is not automatically card artwork.
reference.rights||Record ownership, permission or licence limits for this example. Inspiration does not by itself permit reproduction.
media.url||Paste the complete external HTTPS destination for the optional QR. Readers need access to that destination; changing a printed link requires a new code and reprint.
media.mediaLabel||Give the linked content a useful name, such as a reading, video or sound piece. The label does not change the encoded URL.
making.name||Name this working edition so its specification and proof records can be distinguished from the underlying deck.
making.finished|What would make this edition feel complete enough for its intended purpose?|Describe the finished experience for this edition, whether personal, digital or printed.
making.quantity||Record a provisional quantity or digital delivery intention. This is planning, not an order.
making.materials|How should the cards feel to handle in the way you imagine them being used?|Note stock, flexibility, finish and handling preferences, marking choices that still need supplier samples.
making.companion|What kind of support would make the reader feel welcomed rather than overwhelmed?|Record the companion's intended format and relationship to this edition.
making.packaging|What should the first encounter with the deck feel like?|Record packaging, storage or digital presentation preferences and outstanding dimensions or requirements.
making.values|Which material or accessibility choices express the values of the work?|Record durability, sourcing, waste and usability priorities; supplier claims still need evidence.
making.partners||Keep comparable supplier options, questions and reasons here. Note what each quotation includes, excludes and when it expires.
making.costs||Separate assumptions from actual quotations, including currency, setup, freight, taxes and contingencies. This does not calculate profit or place a commitment.
making.delivery||Record delivery, inspection and handover responsibilities, with uncertainties stated rather than assumed.
making.rights||List permissions, credits, restrictions and evidence needed for this edition's intended use. Nothing is cleared automatically.
making.outstanding|Which unresolved issue would most affect a responsible next decision?|Keep open questions and deliberate exceptions visible before recording or reviewing a package.
making.proofNotes||Describe the specific proof reviewed, observations, requested corrections and conditions. An internal decision does not instruct a supplier or certify the whole deck.
launch.success|What would make this work's life beyond you meaningful, even if it reached only a few people?|Define success in your own terms; no sales or audience-size target is required.
launch.audience|Who might feel recognized, intrigued or supported by this work?|Describe the people you hope to reach without collecting their private contact details.
launch.shortDescription|What invitation should someone understand in a few clear sentences?|Write a concise description that stands alone. Avoid claims you cannot support.
launch.story|What connects the deck's beginning, its creative approach and what it now offers?|Write an independently editable story. Only explicitly approved selected words are brought in; the journal stays private.
launch.crowdfunding|Would supporter-backed production genuinely suit your resources and the relationships you want to build?|Record evidence for costs, feasible rewards, audience preparation and fulfillment. Planning does not open a campaign.
launch.releaseBefore||Record the materials, permissions, tests and truthful expectations needed before release. Use real readiness rather than assuming a fixed launch date.
launch.rights||Record permissions, responsibilities, delivered-cost assumptions and unverified economic questions. This is not legal clearance or a selling-price calculator.
launch.releaseDuring|What kind of introduction feels natural to this deck and its creator?|Record what you intend to announce and promise. Nothing is sent or posted from this field.
launch.releaseAfter|What would help recipients feel cared for after the first introduction?|Plan delivery, access and updates without storing unnecessary recipient information here.
launch.learning|What would you like to learn from the deck's life, and what would let you consider the work finished?|Keep observations, possible corrections and future editions separate from changes to an already released edition.
launch.campaignDuration||Record the contemplated live campaign duration and provider assumptions. It is separate from the communications lead-in and is not configured on a provider.
launch.leadWeeks||Choose an editable communications lead-in in weeks. Five, seven and nine are starting points, not proven optimal lengths or live campaign durations.
question.text|What would help another creator understand the decision you are exploring, while leaving space for different perspectives?|Prepare a question only. The channel audience and available access must be reviewed before any separate posting action.
question.excerpt||Paste only the exact material you deliberately want that audience to see. No card, journal or project content is selected automatically.
production.component_specifications||Record the edition's actual components and supplier-specific requirements: quantity, shared dimensions, materials, packaging and companion format.
production.artwork_delivery_specifications||Record original-file dimensions, resolution, bleed, color requirements, filenames and proofing responsibilities. Working JPEG previews are not production originals.
production.rights_and_permissions||List rights holders, evidence, allowed uses, restrictions and unresolved permissions for the proposed edition.
production.prototype_results|What did using a real prototype reveal that the screen could not?|Record what was tested, observations, changes and unanswered questions; a prototype is not automatic production approval.
production.supplier_quotes||Compare like specifications and delivered cost: supplier, date, currency, quantity, setup, freight, taxes, terms and validity.
production.costing_and_pricing||Separate fixed and per-unit costs, fees, exclusions and contingencies. State evidence behind assumptions rather than treating a subtotal as profit.
production.fulfilment_plan||Record storage, packaging, destinations, delivery assumptions, responsibilities and exceptions. No shipping or order is executed here.
production.publication_assets||List the selected images, descriptions, demonstrations and approved public materials still required. Nothing is published from this list.
production.launch_decision|What evidence would let you proceed responsibly, and what would justify pausing?|Record the decision, unresolved risks and conditions. This note is not a supplier instruction.
production.next_action||Name the next concrete production task, who will do it and any actual agreed date.
production.planned_quantity||Enter the intended number of decks for this plan. It is not an inventory count or supplier order.
production.target_release_date||Record a target only if useful. It does not create a deadline, reminder or promise to buyers.
programme.current_task|What can you practise or develop now that will move your own deck forward?|Record the current deck task associated with this learning material; it does not alter the course content.
programme.notes|Which observation or question would make this lesson useful to your own process?|Keep optional private working notes. They are not submitted as a request for personal feedback.
utility.search||Search the existing card collection by title, number or family. Searching does not edit, create or reorder cards.
utility.username||Choose a public community name using letters and numbers. Capitals can display, but uniqueness ignores case; protected names may be unavailable. Your private full name and administrator authority are separate.
utility.startingPlace||Choose the closest current stage. It guides the invitation and does not restrict tools or determine eligibility.
utility.background||Choose context only if it helps. This is optional and is not a professional credential check.
utility.guidance||Choose guided prompts or independent work. You can change this without changing your access or completing reflection.
utility.status||Choose the working status that matches your judgement. A complete label does not verify rights, editorial approval or print readiness.
utility.deck_type||Choose the closest working deck form. It does not generate a mandatory card count or fixed symbolic system.
utility.pathway||Choose the intended scale or use of the work. This is a project planning choice, not a purchase or entitlement.
utility.family_id||Associate this card with an existing family, or leave it unassigned. This does not duplicate the card.
utility.section_type||Choose the kind of companion section so the manuscript can be organised meaningfully.
utility.card_id||Choose the card this section explains, or leave it as a general section. A linked card is a section-to-card association, not a related-card interpretation.
utility.entry_kind||Choose whether the journal entry is a reflection, decision or milestone. The entry remains private.
utility.linked_card_id||Link the private journal entry to a card for context. The link does not publish the entry or replace the card's writing.
utility.linked_section_id||Link the entry to the relevant companion section. Your private notes remain separate from reader-facing manuscript text.
utility.entry||Choose the private journal entry from which you want to prepare an update. Selection alone does not publish or expose its contents.
utility.photo_id||Choose an available photograph belonging to the selected source entry. Using it in an excerpt does not prove rights or publish it.
utility.purpose||Choose the intended use of this prepared excerpt. It records an intention, not permission to post or publication.
utility.source_card||Choose the source card for this companion entry. Copying text is separate and explicit; general sections can remain unlinked.
utility.relationshipLens|Which thread would help you see the deck more clearly: its imagery, recurring symbols, families or unfolding journey?|Switch views of the same cards. Color swatches are saved layout choices, not image analysis; symbol connections are only those you have recorded. This never rearranges cards.
utility.mapView||Switch how you view the same collection. A view change does not create another deck or alter writing.
utility.connectionFrom||Choose one existing card to connect. Both cards must belong to this project.
utility.connectionTo||Choose a different existing card; the relationship will be described in your own words.
utility.elements||Choose complete artwork when your image already contains the titles, numbers and borders. Studio then leaves those elements untouched. Choose Studio-managed elements only for labels and borders you want Studio to add.
media.qrPlacement||Choose the card, the Guidebook, both or neither. The card code is kept inside the selected template’s safe area; original artwork is never rewritten. Check a physical proof before printing.
utility.sizePreset||Choose a verified finished-cut size for the whole deck. Later resizing affects artwork and needs explicit review; preview size is not print certification.
utility.sample||Choose an existing card as the shared layout sample. Its text and image remain part of the same card record.
utility.border||Choose whether a border frames the image. This is a design preference; Studio shows the selected template’s trim and safe-area guides. Original artwork stays unchanged.
utility.fit||Fit shows the whole image; Fill crops it to the card. Repositioning changes the working preview, not the original file on your computer.
utility.titleFont||Choose a preview font for the visible title. Check licensing and actual production font handling separately.
utility.numberFont||Choose a preview font for the card number or label. It can differ from the title without changing the card's identity.
utility.backMode||Choose a shared back or separate back images. The physical deck size remains shared in either arrangement.
utility.makingPath||Choose a provisional production approach. It can change; selecting multiple formats here does not create separate edition records.
utility.proofPackage||Choose the exact recorded package this proof decision concerns. Earlier package references remain unchanged.
utility.proofKind||Name the proof you actually reviewed. A screen preview is not a physical sample.
utility.proofDecision||Record pause, requested revisions or acceptance of this specific proof with conditions. It does not authorize manufacturing.
utility.storyAudience||Record who you intend this story for. The story remains private in Studio; this choice does not publish or send it.
`;
for(const line of lines.trim().split('\n')){const [key,personal,practical]=line.split('|');FIELD_WISDOM[key]={...(personal?{personal}:{}),practical}}
export function fieldWisdom(key:string){return FIELD_WISDOM[key]}

